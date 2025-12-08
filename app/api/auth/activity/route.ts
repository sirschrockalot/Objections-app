import { NextRequest, NextResponse } from 'next/server';
import UserActivity from '@/lib/models/UserActivity';
import { createApiHandler } from '@/lib/api/routeHandler';
import { RATE_LIMITS } from '@/lib/rateLimiter';

export const POST = createApiHandler({
  rateLimit: RATE_LIMITS.api,
  requireAuth: true,
  errorContext: 'Track activity',
  handler: async (req, { userId }) => {
    const body = await req.json();
    const { action, metadata } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    await UserActivity.create({
      userId,
      action,
      metadata: metadata || {},
      timestamp: new Date(),
      userAgent: req.headers.get('user-agent') || undefined,
      url: req.headers.get('referer') || undefined,
    });

    return { success: true };
  },
});

