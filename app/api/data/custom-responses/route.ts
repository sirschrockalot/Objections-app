import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CustomResponse from '@/lib/models/CustomResponse';
import { requireAuth, createAuthErrorResponse } from '@/lib/authMiddleware';
import { createRateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter';
import { getSafeErrorMessage, logError } from '@/lib/errorHandler';
import { sanitizeString, sanitizeObjectId } from '@/lib/inputValidation';

const apiRateLimit = createRateLimitMiddleware(RATE_LIMITS.api);

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
    const objectionIdParam = searchParams.get('objectionId');

    const query: any = { userId };
    if (objectionIdParam) {
      const sanitizedObjectionId = sanitizeObjectId(objectionIdParam);
      if (sanitizedObjectionId) {
        query.objectionId = sanitizedObjectionId;
      }
    }

    const responses = await CustomResponse.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      responses: responses.map((r) => ({
        id: r.responseId,
        objectionId: r.objectionId, // Include objectionId so client can group responses
        text: r.text,
        isCustom: r.isCustom,
        createdAt: r.createdAt.toISOString(),
        createdBy: r.createdBy,
        upvotes: r.upvotes,
        upvotedBy: r.upvotedBy,
      })),
    });
  } catch (error: any) {
    logError('Get custom responses', error);
    return NextResponse.json(
      { error: getSafeErrorMessage(error, 'Failed to get responses') },
      { status: 500 }
    );
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
    const { objectionId, response } = body;

    // Sanitize inputs
    const sanitizedObjectionId = sanitizeObjectId(objectionId);
    const sanitizedResponseId = sanitizeObjectId(response?.id);
    const sanitizedText = sanitizeString(response?.text, 5000);

    if (!sanitizedObjectionId || !response || !sanitizedResponseId || !sanitizedText) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const customResponse = await CustomResponse.create({
      userId,
      objectionId: sanitizedObjectionId,
      responseId: sanitizedResponseId,
      text: sanitizedText,
      isCustom: response.isCustom ?? true,
      createdAt: new Date(response.createdAt || Date.now()),
      createdBy: sanitizeString(response.createdBy, 255) || undefined,
      upvotes: response.upvotes || 0,
      upvotedBy: response.upvotedBy || [],
    });

    return NextResponse.json({
      response: {
        id: customResponse.responseId,
        text: customResponse.text,
        isCustom: customResponse.isCustom,
        createdAt: customResponse.createdAt.toISOString(),
        createdBy: customResponse.createdBy,
        upvotes: customResponse.upvotes,
        upvotedBy: customResponse.upvotedBy,
      },
    });
  } catch (error: any) {
    logError('Save custom response', error);
    return NextResponse.json(
      { error: getSafeErrorMessage(error, 'Failed to save response') },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const { objectionId, responseId } = body;

    if (!objectionId || !responseId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const response = await CustomResponse.findOne({ userId, objectionId, responseId });
    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }

    // Toggle upvote
    const index = response.upvotedBy.indexOf(userId);
    if (index > -1) {
      response.upvotedBy.splice(index, 1);
      response.upvotes = Math.max(0, response.upvotes - 1);
    } else {
      response.upvotedBy.push(userId);
      response.upvotes = (response.upvotes || 0) + 1;
    }

    await response.save();

    return NextResponse.json({
      response: {
        id: response.responseId,
        upvotes: response.upvotes,
        upvotedBy: response.upvotedBy,
      },
    });
  } catch (error: any) {
    console.error('Upvote response error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upvote' }, { status: 500 });
  }
}

