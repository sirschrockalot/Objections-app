import { NextRequest, NextResponse } from 'next/server';
import VoiceSession from '@/lib/models/VoiceSession';
import { createApiHandler } from '@/lib/api/routeHandler';
import { RATE_LIMITS } from '@/lib/rateLimiter';

export const GET = createApiHandler({
  rateLimit: RATE_LIMITS.read,
  requireAuth: true,
  errorContext: 'Get voice sessions',
  handler: async (req, { userId }) => {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    const query: any = { userId };
    if (sessionId) {
      query.sessionId = sessionId;
    }

    const sessions = await VoiceSession.find(query).sort({ startTime: -1 }).lean();
    return {
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
    };
  },
});

export const POST = createApiHandler({
  rateLimit: RATE_LIMITS.read,
  requireAuth: true,
  errorContext: 'Save voice session',
  handler: async (req, { userId }) => {
    const body = await req.json();
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

    return {
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
    };
  },
});

export const DELETE = createApiHandler({
  rateLimit: RATE_LIMITS.read,
  requireAuth: true,
  errorContext: 'Delete voice session',
  handler: async (req, { userId }) => {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    await VoiceSession.deleteOne({ userId, sessionId });
    return { success: true };
  },
});

