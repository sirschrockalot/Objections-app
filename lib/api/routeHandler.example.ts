/**
 * EXAMPLE IMPLEMENTATION: API Route Handler Wrapper
 * 
 * This file demonstrates how the route handler wrapper would work.
 * This is a reference implementation - not yet integrated.
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
      if (rateLimiter) {
        const rateLimitResult = await rateLimiter(request);
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

      // 3. Database Connection (if auth is required, DB is already connected)
      if (!needsAuth) {
        await connectDB();
      }

      // 4. Create Handler Context
      const context: HandlerContext = {
        userId: auth?.userId || '',
        isAdmin: auth?.isAdmin || false,
        email: auth?.email,
        rateLimitRemaining: rateLimiter ? (await rateLimiter(request)).remaining : 0,
        request,
      };

      // 5. Execute Handler
      const result = await handler(request, context);

      // 6. Format Response
      if (result instanceof NextResponse) {
        // Handler returned a NextResponse directly
        if (rateLimiter && context.rateLimitRemaining > 0) {
          result.headers.set('X-RateLimit-Remaining', context.rateLimitRemaining.toString());
        }
        return result;
      }

      // Handler returned data object - wrap in NextResponse
      const response = NextResponse.json(result);
      if (rateLimiter && context.rateLimitRemaining > 0) {
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

/**
 * Example: Before and After Comparison
 */

// ============================================
// BEFORE (Current Pattern - 48 lines)
// ============================================
/*
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    // Require authentication
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return createAuthErrorResponse(auth);
    }

    await connectDB();
    const userId = auth.userId!;

    const { searchParams } = new URL(request.url);
    const objectionId = searchParams.get('objectionId');

    const query: any = { userId };
    if (objectionId) {
      query.objectionId = objectionId;
    }

    const notes = await ObjectionNote.find(query).lean();

    const response = NextResponse.json({
      notes: notes.map((n) => ({
        objectionId: n.objectionId,
        note: n.note,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      })),
    });

    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    return response;
  } catch (error: any) {
    console.error('Get notes error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get notes' }, { status: 500 });
  }
}
*/

// ============================================
// AFTER (With Route Handler - 12 lines)
// ============================================
/*
import { createApiHandler } from '@/lib/api/routeHandler';
import { RATE_LIMITS } from '@/lib/rateLimiter';
import ObjectionNote from '@/lib/models/ObjectionNote';
import { formatNote } from '@/lib/api/responseFormatters';

export const GET = createApiHandler({
  rateLimit: RATE_LIMITS.read,
  requireAuth: true,
  errorContext: 'Get notes',
  handler: async (req, { userId }) => {
    const { searchParams } = new URL(req.url);
    const objectionId = searchParams.get('objectionId');

    const query: any = { userId };
    if (objectionId) {
      query.objectionId = objectionId;
    }

    const notes = await ObjectionNote.find(query).lean();
    return { notes: notes.map(formatNote) };
  },
});
*/

/**
 * Additional Examples
 */

// Example 1: Public endpoint (no auth)
/*
export const GET = createApiHandler({
  rateLimit: RATE_LIMITS.public,
  handler: async (req) => {
    return { message: 'Public data' };
  },
});
*/

// Example 2: Admin-only endpoint
/*
export const POST = createApiHandler({
  rateLimit: RATE_LIMITS.write,
  requireAdmin: true,
  errorContext: 'Create user',
  handler: async (req, { userId, isAdmin }) => {
    const body = await req.json();
    // ... admin logic
    return { success: true };
  },
});
*/

// Example 3: Custom response (with status code)
/*
export const POST = createApiHandler({
  rateLimit: RATE_LIMITS.write,
  requireAuth: true,
  handler: async (req, { userId }) => {
    const body = await req.json();
    const result = await createSomething(body, userId);
    
    // Return NextResponse directly for custom status/headers
    return NextResponse.json(result, { status: 201 });
  },
});
*/

