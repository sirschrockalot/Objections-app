import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ReviewSchedule from '@/lib/models/ReviewSchedule';
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
    const dueOnly = searchParams.get('dueOnly') === 'true';

    const query: any = { userId };
    if (objectionId) {
      query.objectionId = objectionId;
    }
    if (dueOnly) {
      const today = new Date().toISOString().split('T')[0];
      query.isDue = true;
      query.nextReviewDate = { $lte: today };
    }

    const schedules = await ReviewSchedule.find(query).lean();

    return NextResponse.json({
      schedules: schedules.map((s) => ({
        objectionId: s.objectionId,
        nextReviewDate: s.nextReviewDate,
        interval: s.interval,
        easeFactor: s.easeFactor,
        repetitions: s.repetitions,
        lastReviewDate: s.lastReviewDate,
        isDue: s.isDue,
      })),
    });
  } catch (error: any) {
    console.error('Get review schedules error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get schedules' }, { status: 500 });
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
    const { schedule } = body;

    if (!schedule || !schedule.objectionId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const existing = await ReviewSchedule.findOne({ userId, objectionId: schedule.objectionId });
    let scheduleDoc;

    if (existing) {
      existing.nextReviewDate = schedule.nextReviewDate;
      existing.interval = schedule.interval;
      existing.easeFactor = schedule.easeFactor;
      existing.repetitions = schedule.repetitions;
      existing.lastReviewDate = schedule.lastReviewDate;
      existing.isDue = schedule.isDue;
      await existing.save();
      scheduleDoc = existing;
    } else {
      scheduleDoc = await ReviewSchedule.create({
        userId,
        objectionId: schedule.objectionId,
        nextReviewDate: schedule.nextReviewDate,
        interval: schedule.interval,
        easeFactor: schedule.easeFactor,
        repetitions: schedule.repetitions,
        lastReviewDate: schedule.lastReviewDate,
        isDue: schedule.isDue,
      });
    }

    return NextResponse.json({
      schedule: {
        objectionId: scheduleDoc.objectionId,
        nextReviewDate: scheduleDoc.nextReviewDate,
        interval: scheduleDoc.interval,
        easeFactor: scheduleDoc.easeFactor,
        repetitions: scheduleDoc.repetitions,
        lastReviewDate: scheduleDoc.lastReviewDate,
        isDue: scheduleDoc.isDue,
      },
    });
  } catch (error: any) {
    console.error('Save review schedule error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save schedule' }, { status: 500 });
  }
}

