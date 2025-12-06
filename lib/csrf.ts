/**
 * CSRF (Cross-Site Request Forgery) protection
 * Generates and validates CSRF tokens
 */

import crypto from 'crypto';

// In-memory token store (can be upgraded to Redis for production)
const tokenStore = new Map<string, { token: string; expiresAt: Date }>();

// Token expiration: 1 hour
const TOKEN_EXPIRATION_MS = 60 * 60 * 1000;

/**
 * Generates a CSRF token for a session
 */
export function generateCSRFToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_MS);
  
  tokenStore.set(sessionId, { token, expiresAt });
  
  // Clean up expired tokens periodically
  cleanupExpiredTokens();
  
  return token;
}

/**
 * Validates a CSRF token
 */
export function validateCSRFToken(sessionId: string, token: string): boolean {
  const stored = tokenStore.get(sessionId);
  
  if (!stored) {
    return false;
  }
  
  // Check expiration
  if (stored.expiresAt < new Date()) {
    tokenStore.delete(sessionId);
    return false;
  }
  
  // Validate token
  return stored.token === token;
}

/**
 * Cleans up expired tokens
 */
function cleanupExpiredTokens(): void {
  const now = new Date();
  for (const [sessionId, { expiresAt }] of tokenStore.entries()) {
    if (expiresAt < now) {
      tokenStore.delete(sessionId);
    }
  }
}

/**
 * Removes a CSRF token (e.g., on logout)
 */
export function removeCSRFToken(sessionId: string): void {
  tokenStore.delete(sessionId);
}

