import { NextRequest, NextResponse } from 'next/server';
import PracticeHistory from '@/lib/models/PracticeHistory';
import { createApiHandler } from '@/lib/api/routeHandler';
import { RATE_LIMITS } from '@/lib/rateLimiter';

export const GET = createApiHandler({
  rateLimit: RATE_LIMITS.read,
  requireAuth: true,
  errorContext: 'Get practice history',
  handler: async (req, { userId }) => {
    const { searchParams } = new URL(req.url);
    const objectionId = searchParams.get('objectionId');

    const query: any = { userId };
    if (objectionId) {
      query.objectionId = objectionId;
    }

    const history = await PracticeHistory.find(query).sort({ date: 1 }).lean();
    return {
      history: history.map((h) => ({
        objectionId: h.objectionId,
        date: h.date,
        sessionId: h.sessionId,
        confidenceRating: h.confidenceRating,
        timesPracticed: h.timesPracticed,
      })),
    };
  },
});

export const POST = createApiHandler({
  rateLimit: RATE_LIMITS.read,
  requireAuth: true,
  errorContext: 'Record practice history',
  handler: async (req, { userId }) => {
    const body = await req.json();
    const { objectionId, sessionId, confidenceRating } = body;

    if (!objectionId || !sessionId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    const existing = await PracticeHistory.findOne({ userId, objectionId, date: today });

    if (existing) {
      existing.timesPracticed += 1;
      if (confidenceRating) {
        existing.confidenceRating = confidenceRating;
      }
      await existing.save();
      return {
        entry: {
          objectionId: existing.objectionId,
          date: existing.date,
          sessionId: existing.sessionId,
          confidenceRating: existing.confidenceRating,
          timesPracticed: existing.timesPracticed,
        },
      };
    } else {
      // Count existing entries for this objection
      const allHistoryForObjection = await PracticeHistory.find({ userId, objectionId });
      const newEntry = await PracticeHistory.create({
        userId,
        objectionId,
        date: today,
        sessionId,
        confidenceRating,
        timesPracticed: allHistoryForObjection.length + 1,
      });

      return {
        entry: {
          objectionId: newEntry.objectionId,
          date: newEntry.date,
          sessionId: newEntry.sessionId,
          confidenceRating: newEntry.confidenceRating,
          timesPracticed: newEntry.timesPracticed,
        },
      };
    }
  },
});

