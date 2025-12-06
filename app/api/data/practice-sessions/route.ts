import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PracticeSession from '@/lib/models/PracticeSession';
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

    const sessions = await PracticeSession.find({ userId }).sort({ date: -1 }).lean();

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.sessionId,
        date: s.date.toISOString(),
        objectionsPracticed: s.objectionsPracticed,
        duration: s.duration,
        challengeMode: s.challengeMode,
        timeLimit: s.timeLimit,
        goal: s.goal,
      })),
    });
  } catch (error: any) {
    console.error('Get practice sessions error:', error);
    return NextResponse.json({ error: 'Failed to get sessions' }, { status: 500 });
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
    const { session } = body;

    if (!session || !session.id) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const practiceSession = await PracticeSession.create({
      userId,
      sessionId: session.id,
      date: new Date(session.date || Date.now()),
      objectionsPracticed: session.objectionsPracticed || [],
      duration: session.duration || 0,
      challengeMode: session.challengeMode,
      timeLimit: session.timeLimit,
      goal: session.goal,
    });

    return NextResponse.json({
      session: {
        id: practiceSession.sessionId,
        date: practiceSession.date.toISOString(),
        objectionsPracticed: practiceSession.objectionsPracticed,
        duration: practiceSession.duration,
        challengeMode: practiceSession.challengeMode,
        timeLimit: practiceSession.timeLimit,
        goal: practiceSession.goal,
      },
    });
  } catch (error: any) {
    console.error('Save practice session error:', error);
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
  }
}

