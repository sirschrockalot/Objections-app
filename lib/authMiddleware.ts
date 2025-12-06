/**
 * Authentication middleware for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  isAdmin?: boolean;
  email?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Require authentication for an API route
 * Verifies JWT token and optionally checks if user is active
 */
export async function requireAuth(
  request: NextRequest,
  options: { checkActive?: boolean } = {}
): Promise<AuthResult> {
  const { checkActive = true } = options;
  
  const token = getTokenFromRequest(request);
  
  if (!token) {
    return {
      authenticated: false,
      error: 'Authentication required',
      statusCode: 401,
    };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return {
      authenticated: false,
      error: 'Invalid or expired token',
      statusCode: 401,
    };
  }

  // Optionally verify user is still active in database
  if (checkActive) {
    try {
      await connectDB();
      const user = await User.findById(payload.userId).lean();
      
      if (!user || !user.isActive) {
        return {
          authenticated: false,
          error: 'User account is inactive',
          statusCode: 401,
        };
      }

      // Update isAdmin from database (in case it changed)
      return {
        authenticated: true,
        userId: payload.userId,
        isAdmin: user.isAdmin || false,
        email: user.username,
      };
    } catch (error) {
      console.error('Error checking user status:', error);
      // If database check fails, still allow based on token (for resilience)
      return {
        authenticated: true,
        userId: payload.userId,
        isAdmin: payload.isAdmin,
        email: payload.email,
      };
    }
  }

  return {
    authenticated: true,
    userId: payload.userId,
    isAdmin: payload.isAdmin,
    email: payload.email,
  };
}

/**
 * Require admin privileges for an API route
 */
export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  const auth = await requireAuth(request);
  
  if (!auth.authenticated) {
    return auth;
  }

  if (!auth.isAdmin) {
    return {
      authenticated: false,
      error: 'Admin access required',
      statusCode: 403,
    };
  }

  return auth;
}

/**
 * Helper to create error response from auth result
 */
export function createAuthErrorResponse(authResult: AuthResult): NextResponse {
  return NextResponse.json(
    { error: authResult.error || 'Authentication failed' },
    { status: authResult.statusCode || 401 }
  );
}

