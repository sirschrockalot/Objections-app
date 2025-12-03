/**
 * Storage quota management and monitoring
 * Tracks localStorage and IndexedDB usage, provides warnings, and suggests cleanup
 */

export interface StorageUsage {
  localStorage: {
    used: number; // bytes
    available: number; // bytes
    total: number; // bytes
    percentage: number; // 0-100
  };
  indexedDB: {
    used: number; // bytes
    available: number; // bytes (estimated)
    total: number; // bytes (estimated)
    percentage: number; // 0-100
  };
  total: {
    used: number;
    available: number;
    total: number;
    percentage: number;
  };
}

export interface StorageWarning {
  level: 'info' | 'warning' | 'critical';
  message: string;
  suggestions: string[];
}

const WARNING_THRESHOLD = 80; // Warn at 80% usage
const CRITICAL_THRESHOLD = 95; // Critical at 95% usage

/**
 * Estimate localStorage usage
 */
export function estimateLocalStorageUsage(): number {
  if (typeof window === 'undefined') return 0;

  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const value = localStorage.getItem(key);
      if (value) {
        // Each character is roughly 2 bytes (UTF-16)
        total += key.length * 2 + value.length * 2;
      }
    }
  }
  return total;
}

/**
 * Get localStorage quota (approximate)
 */
export function getLocalStorageQuota(): number {
  // Most browsers limit localStorage to 5-10MB
  // We'll use 5MB as a conservative estimate
  return 5 * 1024 * 1024; // 5MB
}

/**
 * Get IndexedDB storage usage
 */
export async function getIndexedDBUsage(): Promise<number> {
  if (typeof window === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
    return 0;
  }

  try {
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  } catch (error) {
    console.error('Error getting IndexedDB usage:', error);
    return 0;
  }
}

/**
 * Get IndexedDB quota
 */
export async function getIndexedDBQuota(): Promise<number> {
  if (typeof window === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
    // Fallback estimate: typically 50% of available disk space, but we'll use 50MB as conservative
    return 50 * 1024 * 1024; // 50MB
  }

  try {
    const estimate = await navigator.storage.estimate();
    return estimate.quota || 50 * 1024 * 1024; // Fallback to 50MB
  } catch (error) {
    console.error('Error getting IndexedDB quota:', error);
    return 50 * 1024 * 1024; // Fallback to 50MB
  }
}

/**
 * Get comprehensive storage usage
 */
export async function getStorageUsage(): Promise<StorageUsage> {
  const localStorageUsed = estimateLocalStorageUsage();
  const localStorageTotal = getLocalStorageQuota();
  const localStorageAvailable = Math.max(0, localStorageTotal - localStorageUsed);
  const localStoragePercentage = (localStorageUsed / localStorageTotal) * 100;

  const indexedDBUsed = await getIndexedDBUsage();
  const indexedDBTotal = await getIndexedDBQuota();
  const indexedDBAvailable = Math.max(0, indexedDBTotal - indexedDBUsed);
  const indexedDBPercentage = (indexedDBTotal > 0 ? (indexedDBUsed / indexedDBTotal) * 100 : 0);

  const totalUsed = localStorageUsed + indexedDBUsed;
  const totalAvailable = localStorageAvailable + indexedDBAvailable;
  const total = localStorageTotal + indexedDBTotal;
  const totalPercentage = (totalUsed / total) * 100;

  return {
    localStorage: {
      used: localStorageUsed,
      available: localStorageAvailable,
      total: localStorageTotal,
      percentage: localStoragePercentage,
    },
    indexedDB: {
      used: indexedDBUsed,
      available: indexedDBAvailable,
      total: indexedDBTotal,
      percentage: indexedDBPercentage,
    },
    total: {
      used: totalUsed,
      available: totalAvailable,
      total,
      percentage: totalPercentage,
    },
  };
}

/**
 * Check if storage usage requires warning
 */
export async function checkStorageWarnings(): Promise<StorageWarning | null> {
  const usage = await getStorageUsage();
  const totalPercentage = usage.total.percentage;

  if (totalPercentage >= CRITICAL_THRESHOLD) {
    return {
      level: 'critical',
      message: `Storage is critically full (${totalPercentage.toFixed(1)}% used). You may experience data loss if you continue.`,
      suggestions: [
        'Export your data immediately as a backup',
        'Delete old voice session audio recordings',
        'Clear old practice sessions',
        'Remove unused response templates',
        'Clear browser cache and reload',
      ],
    };
  } else if (totalPercentage >= WARNING_THRESHOLD) {
    return {
      level: 'warning',
      message: `Storage is getting full (${totalPercentage.toFixed(1)}% used). Consider cleaning up to prevent issues.`,
      suggestions: [
        'Export your data as a backup',
        'Delete old voice session audio recordings',
        'Clear old practice sessions (older than 30 days)',
        'Review and remove unused response templates',
      ],
    };
  } else if (totalPercentage >= 60) {
    return {
      level: 'info',
      message: `Storage usage is moderate (${totalPercentage.toFixed(1)}% used).`,
      suggestions: [
        'Consider exporting your data periodically',
        'Review old voice session recordings',
        'Clean up old practice sessions',
      ],
    };
  }

  return null;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get largest storage items (for cleanup suggestions)
 */
export function getLargestStorageItems(): Array<{ key: string; size: number; type: 'localStorage' }> {
  if (typeof window === 'undefined') return [];

  const items: Array<{ key: string; size: number; type: 'localStorage' }> = [];

  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const value = localStorage.getItem(key);
      if (value) {
        const size = (key.length + value.length) * 2; // UTF-16 encoding
        items.push({ key, size, type: 'localStorage' });
      }
    }
  }

  return items.sort((a, b) => b.size - a.size).slice(0, 10); // Top 10 largest
}

/**
 * Estimate cleanup potential
 */
export async function estimateCleanupPotential(): Promise<{
  oldSessions: number; // bytes
  oldAudio: number; // bytes (estimated)
  unusedTemplates: number; // bytes (estimated)
  total: number;
}> {
  // This would require integration with actual storage functions
  // For now, return estimates based on common patterns
  return {
    oldSessions: 0, // Would need to check practice sessions age
    oldAudio: 0, // Would need to check audio recordings age
    unusedTemplates: 0, // Would need to check template usage
    total: 0,
  };
}

/**
 * Test if storage write will succeed
 */
export async function testStorageWrite(size: number): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Not in browser environment' };
  }

  try {
    // Try to write a test item
    const testKey = `__storage_test_${Date.now()}`;
    const testValue = 'x'.repeat(size);
    
    localStorage.setItem(testKey, testValue);
    localStorage.removeItem(testKey);
    
    return { success: true };
  } catch (error) {
    if (error instanceof DOMException) {
      if (error.name === 'QuotaExceededError') {
        return { success: false, error: 'Storage quota exceeded' };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown storage error' };
  }
}

