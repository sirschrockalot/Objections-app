import { NextRequest, NextResponse } from 'next/server';
import ReviewSchedule from '@/lib/models/ReviewSchedule';
import { createApiHandler } from '@/lib/api/routeHandler';
import { RATE_LIMITS } from '@/lib/rateLimiter';
import { formatReviewSchedule } from '@/lib/api/responseFormatters';

export const GET = createApiHandler({
  rateLimit: RATE_LIMITS.read,
  requireAuth: true,
  errorContext: 'Get review schedules',
  handler: async (req, { userId }) => {
    const { searchParams } = new URL(req.url);
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
    return { schedules: schedules.map(formatReviewSchedule) };
  },
});

export const POST = createApiHandler({
  rateLimit: RATE_LIMITS.read,
  requireAuth: true,
  errorContext: 'Save review schedule',
  handler: async (req, { userId }) => {
    const body = await req.json();
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

    return { schedule: formatReviewSchedule(scheduleDoc) };
  },
});

