/**
 * Account lockout mechanism to prevent brute force attacks
 * Tracks failed login attempts and locks accounts after threshold
 */

interface LockoutRecord {
  userId: string;
  attempts: number;
  lockedUntil: Date | null;
  lastAttempt: Date;
}

// In-memory store (can be upgraded to Redis for production)
const lockoutStore = new Map<string, LockoutRecord>();

// Configuration
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const RESET_WINDOW_MS = 60 * 60 * 1000; // 1 hour - reset attempts after this time

/**
 * Records a failed login attempt
 * Returns true if account should be locked
 */
export function recordFailedAttempt(identifier: string): { locked: boolean; remainingAttempts: number; lockedUntil: Date | null } {
  const now = new Date();
  const record = lockoutStore.get(identifier);
  
  if (!record) {
    // First failed attempt
    lockoutStore.set(identifier, {
      userId: identifier,
      attempts: 1,
      lockedUntil: null,
      lastAttempt: now,
    });
    return {
      locked: false,
      remainingAttempts: MAX_FAILED_ATTEMPTS - 1,
      lockedUntil: null,
    };
  }
  
  // Check if lockout period has expired
  if (record.lockedUntil && record.lockedUntil > now) {
    return {
      locked: true,
      remainingAttempts: 0,
      lockedUntil: record.lockedUntil,
    };
  }
  
  // Check if reset window has passed
  const timeSinceLastAttempt = now.getTime() - record.lastAttempt.getTime();
  if (timeSinceLastAttempt > RESET_WINDOW_MS) {
    // Reset attempts
    record.attempts = 1;
    record.lockedUntil = null;
    record.lastAttempt = now;
    lockoutStore.set(identifier, record);
    return {
      locked: false,
      remainingAttempts: MAX_FAILED_ATTEMPTS - 1,
      lockedUntil: null,
    };
  }
  
  // Increment attempts
  record.attempts += 1;
  record.lastAttempt = now;
  
  // Check if threshold reached
  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS);
    lockoutStore.set(identifier, record);
    return {
      locked: true,
      remainingAttempts: 0,
      lockedUntil: record.lockedUntil,
    };
  }
  
  lockoutStore.set(identifier, record);
  return {
    locked: false,
    remainingAttempts: MAX_FAILED_ATTEMPTS - record.attempts,
    lockedUntil: null,
  };
}

/**
 * Clears failed attempts after successful login
 */
export function clearFailedAttempts(identifier: string): void {
  lockoutStore.delete(identifier);
}

/**
 * Checks if an account is currently locked
 */
export function isAccountLocked(identifier: string): { locked: boolean; lockedUntil: Date | null } {
  const record = lockoutStore.get(identifier);
  
  if (!record || !record.lockedUntil) {
    return { locked: false, lockedUntil: null };
  }
  
  const now = new Date();
  if (record.lockedUntil <= now) {
    // Lockout expired, clear it
    lockoutStore.delete(identifier);
    return { locked: false, lockedUntil: null };
  }
  
  return { locked: true, lockedUntil: record.lockedUntil };
}

/**
 * Gets remaining attempts before lockout
 */
export function getRemainingAttempts(identifier: string): number {
  const record = lockoutStore.get(identifier);
  if (!record) return MAX_FAILED_ATTEMPTS;
  
  const { locked } = isAccountLocked(identifier);
  if (locked) return 0;
  
  return Math.max(0, MAX_FAILED_ATTEMPTS - record.attempts);
}

