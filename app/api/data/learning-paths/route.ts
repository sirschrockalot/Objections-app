import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LearningPathProgress from '@/lib/models/LearningPathProgress';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pathId = searchParams.get('pathId');

    const query: any = { userId };
    if (pathId) {
      query.pathId = pathId;
    }

    const progress = await LearningPathProgress.find(query).lean();

    return NextResponse.json({
      progress: progress.map((p) => ({
        pathId: p.pathId,
        currentStep: p.currentStep,
        completedSteps: p.completedSteps,
        startedAt: p.startedAt.toISOString(),
        completedAt: p.completedAt?.toISOString(),
        lastPracticedAt: p.lastPracticedAt?.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Get learning path progress error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get progress' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
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

    return NextResponse.json({
      progress: {
        pathId: progressDoc.pathId,
        currentStep: progressDoc.currentStep,
        completedSteps: progressDoc.completedSteps,
        startedAt: progressDoc.startedAt.toISOString(),
        completedAt: progressDoc.completedAt?.toISOString(),
        lastPracticedAt: progressDoc.lastPracticedAt?.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Save learning path progress error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save progress' }, { status: 500 });
  }
}

