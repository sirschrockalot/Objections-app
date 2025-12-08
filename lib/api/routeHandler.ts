/**
 * API Route Handler Wrapper
 * 
 * Provides a high-level wrapper for Next.js API routes that handles:
 * - Rate limiting
 * - Authentication
 * - Database connection
 * - Error handling
 * - Response formatting
 * 
 * Usage:
 *   export const GET = createApiHandler({
 *     rateLimit: RATE_LIMITS.read,
 *     requireAuth: true,
 *     handler: async (req, { userId }) => {
 *       const notes = await ObjectionNote.find({ userId }).lean();
 *       return { notes: notes.map(formatNote) };
 *     },
 *   });
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin, createAuthErrorResponse, AuthResult } from '@/lib/authMiddleware';
import { createRateLimitMiddleware, RateLimitConfig, RATE_LIMITS } from '@/lib/rateLimiter';
import { getSafeErrorMessage, logError } from '@/lib/errorHandler';
import connectDB from '@/lib/mongodb';

export interface HandlerContext {
  userId: string;
  isAdmin: boolean;
  email?: string;
  rateLimitRemaining: number;
  request: NextRequest;
}

export type RouteHandler = (
  request: NextRequest,
  context: HandlerContext
) => Promise<NextResponse | { [key: string]: any }>;

export interface RouteHandlerOptions {
  rateLimit?: RateLimitConfig;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  handler: RouteHandler;
  errorContext?: string; // For error logging
}

/**
 * Creates a Next.js API route handler with built-in:
 * - Rate limiting
 * - Authentication
 * - Database connection
 * - Error handling
 * - Response formatting
 */
export function createApiHandler(options: RouteHandlerOptions) {
  const {
    rateLimit,
    requireAuth: needsAuth = false,
    requireAdmin: needsAdmin = false,
    handler,
    errorContext = 'API Handler',
  } = options;

  // Create rate limiter if config provided
  const rateLimiter = rateLimit ? createRateLimitMiddleware(rateLimit) : null;

  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // 1. Rate Limiting
      let rateLimitResult: { allowed: boolean; response?: NextResponse; remaining: number } | null = null;
      if (rateLimiter) {
        rateLimitResult = await rateLimiter(request);
        if (!rateLimitResult.allowed) {
          return rateLimitResult.response!;
        }
      }

      // 2. Authentication
      let auth: AuthResult | null = null;
      if (needsAdmin) {
        auth = await requireAdmin(request);
      } else if (needsAuth) {
        auth = await requireAuth(request);
      }

      if (auth && !auth.authenticated) {
        return createAuthErrorResponse(auth);
      }

      // 3. Database Connection
      // Note: If auth is required, requireAuth already connects to DB
      // But we still need to ensure connection for non-auth routes
      if (!needsAuth) {
        await connectDB();
      }

      // 4. Create Handler Context
      const context: HandlerContext = {
        userId: auth?.userId || '',
        isAdmin: auth?.isAdmin || false,
        email: auth?.email,
        rateLimitRemaining: rateLimitResult?.remaining || 0,
        request,
      };

      // 5. Execute Handler
      const result = await handler(request, context);

      // 6. Format Response
      if (result instanceof NextResponse) {
        // Handler returned a NextResponse directly
        if (rateLimitResult && context.rateLimitRemaining > 0) {
          result.headers.set('X-RateLimit-Remaining', context.rateLimitRemaining.toString());
        }
        return result;
      }

      // Handler returned data object - wrap in NextResponse
      const response = NextResponse.json(result);
      if (rateLimitResult && context.rateLimitRemaining > 0) {
        response.headers.set('X-RateLimit-Remaining', context.rateLimitRemaining.toString());
      }
      return response;
    } catch (error: any) {
      // 7. Error Handling
      logError(errorContext, error);
      return NextResponse.json(
        { error: getSafeErrorMessage(error, 'An error occurred. Please try again later.') },
        { status: 500 }
      );
    }
  };
}

