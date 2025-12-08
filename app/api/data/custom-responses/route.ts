import { NextRequest, NextResponse } from 'next/server';
import CustomResponse from '@/lib/models/CustomResponse';
import { createApiHandler } from '@/lib/api/routeHandler';
import { RATE_LIMITS } from '@/lib/rateLimiter';
import { formatCustomResponse } from '@/lib/api/responseFormatters';
import { sanitizeString, sanitizeObjectId } from '@/lib/inputValidation';

export const GET = createApiHandler({
  rateLimit: RATE_LIMITS.api,
  requireAuth: true,
  errorContext: 'Get custom responses',
  handler: async (req, { userId }) => {
    const { searchParams } = new URL(req.url);
    const objectionIdParam = searchParams.get('objectionId');

    const query: any = { userId };
    if (objectionIdParam) {
      const sanitizedObjectionId = sanitizeObjectId(objectionIdParam);
      if (sanitizedObjectionId) {
        query.objectionId = sanitizedObjectionId;
      }
    }

    const responses = await CustomResponse.find(query).sort({ createdAt: -1 }).lean();
    return { responses: responses.map(formatCustomResponse) };
  },
});

export const POST = createApiHandler({
  rateLimit: RATE_LIMITS.api,
  requireAuth: true,
  errorContext: 'Save custom response',
  handler: async (req, { userId }) => {
    const body = await req.json();
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

    return { response: formatCustomResponse(customResponse) };
  },
});

export const PUT = createApiHandler({
  rateLimit: RATE_LIMITS.api,
  requireAuth: true,
  errorContext: 'Upvote response',
  handler: async (req, { userId }) => {
    const body = await req.json();
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

    return {
      response: {
        id: response.responseId,
        upvotes: response.upvotes,
        upvotedBy: response.upvotedBy,
      },
    };
  },
});

