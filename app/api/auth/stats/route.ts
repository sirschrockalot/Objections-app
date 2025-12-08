import { NextRequest, NextResponse } from 'next/server';
import UserActivity from '@/lib/models/UserActivity';
import { createApiHandler } from '@/lib/api/routeHandler';
import { RATE_LIMITS } from '@/lib/rateLimiter';

export const GET = createApiHandler({
  rateLimit: RATE_LIMITS.read,
  requireAuth: true,
  errorContext: 'Get user stats',
  handler: async (req, { userId }) => {
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get('userId') || userId;

    if (!userIdParam) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const activities = await UserActivity.find({ userId: userIdParam })
      .sort({ timestamp: -1 })
      .lean();

    const logins = activities.filter((a) => a.action === 'login');
    const sessions = new Set(
      activities.map((a) => a.timestamp.toISOString().split('T')[0])
    ).size;

    const actionsByType: Record<string, number> = {};
    activities.forEach((a) => {
      actionsByType[a.action] = (actionsByType[a.action] || 0) + 1;
    });

    return {
      totalLogins: logins.length,
      lastLoginAt: logins.length > 0 ? logins[0].timestamp.toISOString() : null,
      totalSessions: sessions,
      actionsByType,
    };
  },
});

