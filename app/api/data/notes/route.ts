import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ObjectionNote from '@/lib/models/ObjectionNote';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

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
    await connectDB();

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

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
    await connectDB();

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

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

