import { NextRequest, NextResponse } from 'next/server';
import UserActivity from '@/lib/models/UserActivity';
import { createApiHandler } from '@/lib/api/routeHandler';
import { RATE_LIMITS } from '@/lib/rateLimiter';

export const GET = createApiHandler({
  rateLimit: RATE_LIMITS.read,
  requireAuth: true,
  errorContext: 'Get activities',
  handler: async (req, { userId }) => {
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get('userId') || userId;

    let query: any = {};
    if (userIdParam) {
      query.userId = userIdParam;
    }

    const activities = await UserActivity.find(query)
      .sort({ timestamp: -1 })
      .limit(1000)
      .lean();

    return {
      activities: activities.map((activity) => ({
        userId: activity.userId,
        action: activity.action,
        timestamp: activity.timestamp.toISOString(),
        metadata: activity.metadata,
        userAgent: activity.userAgent,
        url: activity.url,
      })),
    };
  },
});

