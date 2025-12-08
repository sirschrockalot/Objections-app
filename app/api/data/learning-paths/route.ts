import { NextRequest, NextResponse } from 'next/server';
import LearningPathProgress from '@/lib/models/LearningPathProgress';
import { createApiHandler } from '@/lib/api/routeHandler';
import { RATE_LIMITS } from '@/lib/rateLimiter';

export const GET = createApiHandler({
  rateLimit: RATE_LIMITS.read,
  requireAuth: true,
  errorContext: 'Get learning path progress',
  handler: async (req, { userId }) => {
    const { searchParams } = new URL(req.url);
    const pathId = searchParams.get('pathId');

    const query: any = { userId };
    if (pathId) {
      query.pathId = pathId;
    }

    const progress = await LearningPathProgress.find(query).lean();
    return {
      progress: progress.map((p) => ({
        pathId: p.pathId,
        currentStep: p.currentStep,
        completedSteps: p.completedSteps,
        startedAt: p.startedAt.toISOString(),
        completedAt: p.completedAt?.toISOString(),
        lastPracticedAt: p.lastPracticedAt?.toISOString(),
      })),
    };
  },
});

export const POST = createApiHandler({
  rateLimit: RATE_LIMITS.read,
  requireAuth: true,
  errorContext: 'Save learning path progress',
  handler: async (req, { userId }) => {
    const body = await req.json();
    const { progress } = body;

    if (!progress || !progress.pathId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const existing = await LearningPathProgress.findOne({ userId, pathId: progress.pathId });
    let progressDoc;

    if (existing) {
      existing.currentStep = progress.currentStep;
      existing.completedSteps = Array.isArray(progress.completedSteps)
        ? progress.completedSteps
        : Array.from(progress.completedSteps || []);
      existing.lastPracticedAt = progress.lastPracticedAt ? new Date(progress.lastPracticedAt) : new Date();
      if (progress.completedAt) {
        existing.completedAt = new Date(progress.completedAt);
      }
      await existing.save();
      progressDoc = existing;
    } else {
      progressDoc = await LearningPathProgress.create({
        userId,
        pathId: progress.pathId,
        currentStep: progress.currentStep || 0,
        completedSteps: Array.isArray(progress.completedSteps)
          ? progress.completedSteps
          : Array.from(progress.completedSteps || []),
        startedAt: new Date(progress.startedAt || Date.now()),
        completedAt: progress.completedAt ? new Date(progress.completedAt) : undefined,
        lastPracticedAt: progress.lastPracticedAt ? new Date(progress.lastPracticedAt) : new Date(),
      });
    }

    return {
      progress: {
        pathId: progressDoc.pathId,
        currentStep: progressDoc.currentStep,
        completedSteps: progressDoc.completedSteps,
        startedAt: progressDoc.startedAt.toISOString(),
        completedAt: progressDoc.completedAt?.toISOString(),
        lastPracticedAt: progressDoc.lastPracticedAt?.toISOString(),
      },
    };
  },
});

