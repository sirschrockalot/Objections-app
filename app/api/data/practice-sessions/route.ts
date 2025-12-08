import { NextRequest, NextResponse } from 'next/server';
import PracticeSession from '@/lib/models/PracticeSession';
import { createApiHandler } from '@/lib/api/routeHandler';
import { RATE_LIMITS } from '@/lib/rateLimiter';
import { formatPracticeSession } from '@/lib/api/responseFormatters';

export const GET = createApiHandler({
  rateLimit: RATE_LIMITS.read,
  requireAuth: true,
  errorContext: 'Get practice sessions',
  handler: async (req, { userId }) => {
    const sessions = await PracticeSession.find({ userId }).sort({ date: -1 }).lean();
    return { 
      sessions: sessions.map(s => ({
        id: s.sessionId,
        date: s.date.toISOString(),
        objectionsPracticed: s.objectionsPracticed,
        duration: s.duration,
        challengeMode: s.challengeMode,
        timeLimit: s.timeLimit,
        goal: s.goal,
      }))
    };
  },
});

export const POST = createApiHandler({
  rateLimit: RATE_LIMITS.read,
  requireAuth: true,
  errorContext: 'Save practice session',
  handler: async (req, { userId }) => {
    const body = await req.json();
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

    return {
      session: {
        id: practiceSession.sessionId,
        date: practiceSession.date.toISOString(),
        objectionsPracticed: practiceSession.objectionsPracticed,
        duration: practiceSession.duration,
        challengeMode: practiceSession.challengeMode,
        timeLimit: practiceSession.timeLimit,
        goal: practiceSession.goal,
      },
    };
  },
});

