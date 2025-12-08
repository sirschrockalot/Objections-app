import { NextRequest, NextResponse } from 'next/server';
import { getCostStats, checkDailyCostLimit } from '@/lib/costTracking';
import { createApiHandler } from '@/lib/api/routeHandler';
import { RATE_LIMITS } from '@/lib/rateLimiter';

export const GET = createApiHandler({
  rateLimit: RATE_LIMITS.read,
  requireAdmin: true,
  errorContext: 'Get cost stats',
  handler: async (req) => {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    const userId = searchParams.get('userId') || undefined;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date();

    const stats = await getCostStats(startDate, endDate, userId);

    // Check daily limit (default $50/day)
    const dailyLimit = parseFloat(searchParams.get('dailyLimit') || '50');
    const dailyLimitCheck = await checkDailyCostLimit(dailyLimit, userId);

    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days,
      },
      costs: {
        total: stats.totalCost,
        byService: stats.costByService,
        dailyBreakdown: stats.dailyCosts,
        count: stats.count,
      },
      dailyLimit: {
        limit: dailyLimit,
        current: dailyLimitCheck.currentCost,
        exceeded: dailyLimitCheck.exceeded,
      },
    };
  },
});

