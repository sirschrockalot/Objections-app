import { NextRequest, NextResponse } from 'next/server';
import ConfidenceRating from '@/lib/models/ConfidenceRating';
import { createApiHandler } from '@/lib/api/routeHandler';
import { RATE_LIMITS } from '@/lib/rateLimiter';
import { formatConfidenceRating } from '@/lib/api/responseFormatters';

export const GET = createApiHandler({
  rateLimit: RATE_LIMITS.read,
  requireAuth: true,
  errorContext: 'Get confidence ratings',
  handler: async (req, { userId }) => {
    const { searchParams } = new URL(req.url);
    const objectionId = searchParams.get('objectionId');

    const query: any = { userId };
    if (objectionId) {
      query.objectionId = objectionId;
    }

    const ratings = await ConfidenceRating.find(query).sort({ date: -1 }).lean();
    return { ratings: ratings.map(formatConfidenceRating) };
  },
});

export const POST = createApiHandler({
  rateLimit: RATE_LIMITS.read,
  requireAuth: true,
  errorContext: 'Save confidence rating',
  handler: async (req, { userId }) => {
    const body = await req.json();
    const { objectionId, rating } = body;

    if (!objectionId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const confidenceRating = await ConfidenceRating.create({
      userId,
      objectionId,
      rating,
      date: new Date(),
    });

    return { rating: formatConfidenceRating(confidenceRating) };
  },
});

