import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import VoiceSession from '@/lib/models/VoiceSession';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    const query: any = { userId };
    if (sessionId) {
      query.sessionId = sessionId;
    }

    const sessions = await VoiceSession.find(query).sort({ startTime: -1 }).lean();

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.sessionId,
        startTime: s.startTime,
        endTime: s.endTime,
        messages: s.messages,
        objectionsPresented: s.objectionsPresented,
        userResponses: s.userResponses,
        metrics: s.metrics,
        status: s.status,
        lastSavedAt: s.lastSavedAt,
        recoveryData: s.recoveryData,
      })),
    });
  } catch (error: any) {
    console.error('Get voice sessions error:', error);
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

    const existing = await VoiceSession.findOne({ userId, sessionId: session.id });
    let sessionDoc;

    if (existing) {
      existing.startTime = session.startTime;
      existing.endTime = session.endTime;
      existing.messages = session.messages || [];
      existing.objectionsPresented = session.objectionsPresented || [];
      existing.userResponses = session.userResponses || [];
      existing.metrics = session.metrics;
      existing.status = session.status;
      existing.lastSavedAt = session.lastSavedAt;
      existing.recoveryData = session.recoveryData;
      await existing.save();
      sessionDoc = existing;
    } else {
      sessionDoc = await VoiceSession.create({
        userId,
        sessionId: session.id,
        startTime: session.startTime,
        endTime: session.endTime,
        messages: session.messages || [],
        objectionsPresented: session.objectionsPresented || [],
        userResponses: session.userResponses || [],
        metrics: session.metrics,
        status: session.status,
        lastSavedAt: session.lastSavedAt,
        recoveryData: session.recoveryData,
      });
    }

    return NextResponse.json({
      session: {
        id: sessionDoc.sessionId,
        startTime: sessionDoc.startTime,
        endTime: sessionDoc.endTime,
        messages: sessionDoc.messages,
        objectionsPresented: sessionDoc.objectionsPresented,
        userResponses: sessionDoc.userResponses,
        metrics: sessionDoc.metrics,
        status: sessionDoc.status,
        lastSavedAt: sessionDoc.lastSavedAt,
        recoveryData: sessionDoc.recoveryData,
      },
    });
  } catch (error: any) {
    console.error('Save voice session error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save session' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    await VoiceSession.deleteOne({ userId, sessionId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete voice session error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete session' }, { status: 500 });
  }
}

