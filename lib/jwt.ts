/**
 * JWT authentication utilities
 */

import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET || 'change-this-in-production-minimum-32-characters';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '15m'; // Short-lived access tokens (15 minutes)
const JWT_REFRESH_EXPIRES_IN: string = process.env.JWT_REFRESH_EXPIRES_IN || '7d'; // Long-lived refresh tokens (7 days)

export interface JWTPayload {
  userId: string;
  isAdmin: boolean;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Sign a JWT token with user information
 */
export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  if (!JWT_SECRET || JWT_SECRET === 'change-this-in-production-minimum-32-characters') {
    console.warn('⚠️  WARNING: Using default JWT_SECRET. Set JWT_SECRET in environment variables for production!');
  }
  
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN,
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Sign a refresh token (longer expiration)
 */
export function signRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const options: SignOptions = {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    // Token is invalid or expired
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Check if token is expired (without verifying signature)
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as JWTPayload | null;
    if (!decoded || !decoded.exp) {
      return true;
    }
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

/**
 * Verify and decode a refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    // Token is invalid or expired
    return null;
  }
}

