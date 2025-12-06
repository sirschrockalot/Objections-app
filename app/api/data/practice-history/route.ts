import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PracticeHistory from '@/lib/models/PracticeHistory';
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

    await connectDB();
    const userId = auth.userId!;

    const { searchParams } = new URL(request.url);
    const objectionId = searchParams.get('objectionId');

    const query: any = { userId };
    if (objectionId) {
      query.objectionId = objectionId;
    }

    const history = await PracticeHistory.find(query).sort({ date: 1 }).lean();

    return NextResponse.json({
      history: history.map((h) => ({
        objectionId: h.objectionId,
        date: h.date,
        sessionId: h.sessionId,
        confidenceRating: h.confidenceRating,
        timesPracticed: h.timesPracticed,
      })),
    });
  } catch (error: any) {
    console.error('Get practice history error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get history' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    await connectDB();
    const userId = auth.userId!;

    const body = await request.json();
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
      return NextResponse.json({
        entry: {
          objectionId: existing.objectionId,
          date: existing.date,
          sessionId: existing.sessionId,
          confidenceRating: existing.confidenceRating,
          timesPracticed: existing.timesPracticed,
        },
      });
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

      return NextResponse.json({
        entry: {
          objectionId: newEntry.objectionId,
          date: newEntry.date,
          sessionId: newEntry.sessionId,
          confidenceRating: newEntry.confidenceRating,
          timesPracticed: newEntry.timesPracticed,
        },
      });
    }
  } catch (error: any) {
    console.error('Record practice history error:', error);
    return NextResponse.json({ error: error.message || 'Failed to record history' }, { status: 500 });
  }
}

