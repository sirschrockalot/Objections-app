/**
 * Refresh token endpoint
 * Allows clients to get a new access token using a refresh token
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, signToken, signRefreshToken } from '@/lib/jwt';
import { createRateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

const authRateLimit = createRateLimitMiddleware(RATE_LIMITS.auth);

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await authRateLimit(request);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Verify user is still active
    await connectDB();
    const user = await User.findById(payload.userId).lean();
    
    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'User account is inactive' },
        { status: 401 }
      );
    }

    // Generate new access token and refresh token
    const newAccessToken = signToken({
      userId: user._id.toString(),
      isAdmin: user.isAdmin || false,
      email: user.username,
    });

    const newRefreshToken = signRefreshToken({
      userId: user._id.toString(),
      isAdmin: user.isAdmin || false,
      email: user.username,
    });

    const response = NextResponse.json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });

    // Add rate limit headers
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());

    return response;
  } catch (error: any) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}

