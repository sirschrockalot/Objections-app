import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PracticeSession from '@/lib/models/PracticeSession';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

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
    return NextResponse.json({ error: error.message || 'Failed to get sessions' }, { status: 500 });
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
    return NextResponse.json({ error: error.message || 'Failed to save session' }, { status: 500 });
  }
}

