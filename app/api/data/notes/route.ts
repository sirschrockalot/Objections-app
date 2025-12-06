import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ObjectionNote from '@/lib/models/ObjectionNote';
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

    const query: any = { userId };
    if (objectionId) {
      query.objectionId = objectionId;
    }

    const notes = await ObjectionNote.find(query).lean();

    return NextResponse.json({
      notes: notes.map((n) => ({
        objectionId: n.objectionId,
        note: n.note,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Get notes error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get notes' }, { status: 500 });
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

    return NextResponse.json({
      note: {
        objectionId: noteDoc.objectionId,
        note: noteDoc.note,
        createdAt: noteDoc.createdAt.toISOString(),
        updatedAt: noteDoc.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Save note error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save note' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

    if (!objectionId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    await ObjectionNote.deleteOne({ userId, objectionId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete note error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete note' }, { status: 500 });
  }
}

