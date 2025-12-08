import { NextRequest, NextResponse } from 'next/server';
import Points from '@/lib/models/Points';
import { createApiHandler } from '@/lib/api/routeHandler';
import { RATE_LIMITS } from '@/lib/rateLimiter';
import { formatPoints } from '@/lib/api/responseFormatters';

export const GET = createApiHandler({
  rateLimit: RATE_LIMITS.read,
  requireAuth: true,
  errorContext: 'Get points',
  handler: async (req, { userId }) => {
    const pointsEntries = await Points.find({ userId }).sort({ date: -1 }).lean();
    const total = pointsEntries.reduce((sum, entry) => sum + entry.points, 0);

    return {
      total,
      history: pointsEntries.map(formatPoints),
    };
  },
});

export const POST = createApiHandler({
  rateLimit: RATE_LIMITS.read,
  requireAuth: true,
  errorContext: 'Add points',
  handler: async (req, { userId }) => {
    const body = await req.json();
    const { points, reason, metadata, pointsId } = body;

    if (!points || !reason) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const pointsEntry = await Points.create({
      userId,
      pointsId: pointsId || `points-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      points,
      reason,
      date: new Date(),
      metadata: metadata || {},
    });

    return { entry: formatPoints(pointsEntry) };
  },
});

