import { NextRequest, NextResponse } from 'next/server';
import ObjectionNote from '@/lib/models/ObjectionNote';
import { createApiHandler } from '@/lib/api/routeHandler';
import { RATE_LIMITS } from '@/lib/rateLimiter';
import { formatNote } from '@/lib/api/responseFormatters';

export const GET = createApiHandler({
  rateLimit: RATE_LIMITS.read,
  requireAuth: true,
  errorContext: 'Get notes',
  handler: async (req, { userId }) => {
    const { searchParams } = new URL(req.url);
    const objectionId = searchParams.get('objectionId');

    const query: any = { userId };
    if (objectionId) {
      query.objectionId = objectionId;
    }

    const notes = await ObjectionNote.find(query).lean();
    return { notes: notes.map(formatNote) };
  },
});

export const POST = createApiHandler({
  rateLimit: RATE_LIMITS.read,
  requireAuth: true,
  errorContext: 'Save note',
  handler: async (req, { userId }) => {
    const body = await req.json();
    const { objectionId, note } = body;

    if (!objectionId || note === undefined) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const existing = await ObjectionNote.findOne({ userId, objectionId });
    let noteDoc;

    if (existing) {
      existing.note = note;
      existing.updatedAt = new Date();
      await existing.save();
      noteDoc = existing;
    } else {
      noteDoc = await ObjectionNote.create({
        userId,
        objectionId,
        note,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return { note: formatNote(noteDoc) };
  },
});

export const DELETE = createApiHandler({
  rateLimit: RATE_LIMITS.read,
  requireAuth: true,
  errorContext: 'Delete note',
  handler: async (req, { userId }) => {
    const { searchParams } = new URL(req.url);
    const objectionId = searchParams.get('objectionId');

    if (!objectionId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    await ObjectionNote.deleteOne({ userId, objectionId });
    return { success: true };
  },
});

