import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createAuthErrorResponse } from '@/lib/authMiddleware';
import { createRateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter';

const apiRateLimit = createRateLimitMiddleware(RATE_LIMITS.read);

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

    // User is already verified in requireAuth, return user info from token
    const response = NextResponse.json({
      user: {
        id: auth.userId,
        email: auth.email,
        isAdmin: auth.isAdmin,
      },
    });

    // Add rate limit headers
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());

    return response;
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user information' },
      { status: 500 }
    );
  }
}

