/**
 * Input validation and sanitization utilities
 * Prevents NoSQL injection and ensures data integrity
 */

/**
 * Sanitizes a string input to prevent NoSQL injection
 * Removes potentially dangerous characters and limits length
 */
export function sanitizeString(input: string | undefined | null, maxLength: number = 1000): string | null {
  if (!input) return null;
  
  // Convert to string and trim
  let sanitized = String(input).trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Remove null bytes and other dangerous characters
  sanitized = sanitized.replace(/\0/g, '');
  
  return sanitized;
}

/**
 * Validates and sanitizes an email address
 */
export function sanitizeEmail(email: string | undefined | null): string | null {
  if (!email) return null;
  
  const sanitized = sanitizeString(email, 255);
  if (!sanitized) return null;
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return null;
  }
  
  return sanitized.toLowerCase();
}

/**
 * Validates and sanitizes a MongoDB ObjectId
 */
export function sanitizeObjectId(id: string | undefined | null): string | null {
  if (!id) return null;
  
  const sanitized = sanitizeString(id, 50);
  if (!sanitized) return null;
  
  // MongoDB ObjectId format: 24 hex characters
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (!objectIdRegex.test(sanitized)) {
    return null;
  }
  
  return sanitized;
}

/**
 * Validates a number input
 */
export function sanitizeNumber(input: any, min?: number, max?: number): number | null {
  if (input === undefined || input === null) return null;
  
  const num = Number(input);
  if (isNaN(num)) return null;
  
  if (min !== undefined && num < min) return null;
  if (max !== undefined && num > max) return null;
  
  return num;
}

/**
 * Validates a boolean input
 */
export function sanitizeBoolean(input: any): boolean | null {
  if (input === undefined || input === null) return null;
  
  if (typeof input === 'boolean') return input;
  if (typeof input === 'string') {
    const lower = input.toLowerCase();
    if (lower === 'true' || lower === '1') return true;
    if (lower === 'false' || lower === '0') return false;
  }
  if (typeof input === 'number') {
    return input !== 0;
  }
  
  return null;
}

/**
 * Validates array input and sanitizes each element
 */
export function sanitizeArray<T>(
  input: any,
  sanitizer: (item: any) => T | null,
  maxLength: number = 100
): T[] {
  if (!Array.isArray(input)) return [];
  
  return input
    .slice(0, maxLength)
    .map(sanitizer)
    .filter((item): item is T => item !== null);
}

