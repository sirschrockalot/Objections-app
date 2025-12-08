/**
 * Refresh token endpoint
 * Allows clients to get a new access token using a refresh token
 * Note: This route doesn't use requireAuth since it uses refresh token instead
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, signToken, signRefreshToken } from '@/lib/jwt';
import { createApiHandler } from '@/lib/api/routeHandler';
import { RATE_LIMITS } from '@/lib/rateLimiter';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export const POST = createApiHandler({
  rateLimit: RATE_LIMITS.auth,
  requireAuth: false, // Uses refresh token instead
  errorContext: 'Refresh token',
  handler: async (req) => {
    const body = await req.json();
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

    return {
      token: newAccessToken,
      refreshToken: newRefreshToken,
    };
  },
});

