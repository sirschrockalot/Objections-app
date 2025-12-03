/**
 * Enhanced error recovery utilities
 * Handles storage failures, network errors, and data corruption gracefully
 */

export interface ErrorRecoveryOptions {
  retry?: boolean;
  fallback?: () => void;
  notifyUser?: boolean;
  logError?: boolean;
}

export interface StorageError {
  type: 'quota' | 'permission' | 'corruption' | 'unknown';
  message: string;
  recoverable: boolean;
  suggestions: string[];
}

/**
 * Handle storage errors with recovery options
 */
export function handleStorageError(
  error: unknown,
  options: ErrorRecoveryOptions = {}
): StorageError {
  const { logError = true } = options;

  if (logError) {
    console.error('Storage error:', error);
  }

  if (error instanceof DOMException) {
    if (error.name === 'QuotaExceededError') {
      return {
        type: 'quota',
        message: 'Storage quota exceeded. Please free up space or export your data.',
        recoverable: true,
        suggestions: [
          'Export your data as a backup',
          'Delete old voice session audio recordings',
          'Clear old practice sessions',
          'Remove unused response templates',
        ],
      };
    } else if (error.name === 'SecurityError') {
      return {
        type: 'permission',
        message: 'Storage access denied. Please check your browser permissions.',
        recoverable: false,
        suggestions: [
          'Check browser privacy settings',
          'Enable localStorage and IndexedDB',
          'Try using a different browser',
        ],
      };
    }
  }

  // Check for JSON parse errors (data corruption)
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return {
      type: 'corruption',
      message: 'Data corruption detected. Attempting to recover...',
      recoverable: true,
      suggestions: [
        'Export your data immediately',
        'Clear corrupted data and start fresh',
        'Restore from a backup if available',
      ],
    };
  }

  return {
    type: 'unknown',
    message: error instanceof Error ? error.message : 'Unknown storage error',
    recoverable: false,
    suggestions: [
      'Try refreshing the page',
      'Clear browser cache',
      'Contact support if the issue persists',
    ],
  };
}

/**
 * Attempt to recover from storage error
 */
export async function recoverFromStorageError(
  error: StorageError,
  key: string
): Promise<boolean> {
  if (!error.recoverable) {
    return false;
  }

  try {
    switch (error.type) {
      case 'quota':
        // Try to clear old data
        return await clearOldData(key);
      case 'corruption':
        // Try to restore from backup or clear corrupted data
        return await recoverCorruptedData(key);
      default:
        return false;
    }
  } catch (recoveryError) {
    console.error('Recovery attempt failed:', recoveryError);
    return false;
  }
}

/**
 * Clear old data to free up space
 */
async function clearOldData(key: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    // Try to identify and remove old items
    // This is a simplified version - in production, you'd want more sophisticated cleanup
    const item = localStorage.getItem(key);
    if (item) {
      // For now, just return false - let the user handle cleanup via UI
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Recover from corrupted data
 */
async function recoverCorruptedData(key: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    // Try to parse and validate data
    const item = localStorage.getItem(key);
    if (!item) return true; // No data to recover

    try {
      JSON.parse(item);
      return true; // Data is valid
    } catch (parseError) {
      // Data is corrupted - remove it
      localStorage.removeItem(key);
      return true; // Recovery successful (by removing corrupted data)
    }
  } catch (error) {
    return false;
  }
}

/**
 * Validate data integrity
 */
export function validateDataIntegrity<T>(data: unknown, validator?: (data: unknown) => data is T): boolean {
  if (!data) return false;
  if (validator) {
    return validator(data);
  }
  // Basic validation - check if it's an object or array
  return typeof data === 'object' && data !== null;
}

/**
 * Create a data backup before risky operations
 */
export function createDataBackup(data: unknown, backupKey: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const backup = {
      data,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(backupKey, JSON.stringify(backup));
    return true;
  } catch (error) {
    console.error('Failed to create backup:', error);
    return false;
  }
}

/**
 * Restore from backup
 */
export function restoreFromBackup<T>(backupKey: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const backupStr = localStorage.getItem(backupKey);
    if (!backupStr) return null;

    const backup = JSON.parse(backupStr);
    return backup.data as T;
  } catch (error) {
    console.error('Failed to restore from backup:', error);
    return null;
  }
}

/**
 * Safe storage operation with error handling and recovery
 */
export async function safeStorageOperation<T>(
  operation: () => T,
  options: ErrorRecoveryOptions = {}
): Promise<{ success: boolean; data?: T; error?: StorageError }> {
  const { retry = true, fallback, notifyUser = true } = options;

  try {
    const data = operation();
    return { success: true, data };
  } catch (error) {
    const storageError = handleStorageError(error, options);

    // Attempt recovery if error is recoverable
    if (retry && storageError.recoverable) {
      try {
        // Recovery logic would go here
        // For now, we'll just return the error
        if (notifyUser) {
          // Error notification would be handled by UI component
        }
        return { success: false, error: storageError };
      } catch (recoveryError) {
        console.error('Recovery failed:', recoveryError);
      }
    }

    // Call fallback if provided
    if (fallback) {
      try {
        fallback();
      } catch (fallbackError) {
        console.error('Fallback failed:', fallbackError);
      }
    }

    return { success: false, error: storageError };
  }
}

/**
 * Network error handler
 */
export function handleNetworkError(error: unknown): {
  type: 'timeout' | 'offline' | 'server' | 'unknown';
  message: string;
  recoverable: boolean;
} {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    // Check if offline
    if (!navigator.onLine) {
      return {
        type: 'offline',
        message: 'You are currently offline. Please check your internet connection.',
        recoverable: true,
      };
    }

    return {
      type: 'server',
      message: 'Unable to connect to server. Please try again later.',
      recoverable: true,
    };
  }

  return {
    type: 'unknown',
    message: error instanceof Error ? error.message : 'Network error occurred',
    recoverable: false,
  };
}

