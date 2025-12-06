import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ResponseTemplate from '@/lib/models/ResponseTemplate';
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

    const templates = await ResponseTemplate.find({ userId }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      templates: templates.map((t) => ({
        id: t.templateId,
        name: t.name,
        acknowledge: t.acknowledge,
        reframe: t.reframe,
        value: t.value,
        nextStep: t.nextStep,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Get templates error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get templates' }, { status: 500 });
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
    const { template } = body;

    if (!template || !template.id) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const existing = await ResponseTemplate.findOne({ userId, templateId: template.id });
    let templateDoc;

    if (existing) {
      existing.name = template.name;
      existing.acknowledge = template.acknowledge;
      existing.reframe = template.reframe;
      existing.value = template.value;
      existing.nextStep = template.nextStep;
      await existing.save();
      templateDoc = existing;
    } else {
      templateDoc = await ResponseTemplate.create({
        userId,
        templateId: template.id,
        name: template.name,
        acknowledge: template.acknowledge,
        reframe: template.reframe,
        value: template.value,
        nextStep: template.nextStep,
        createdAt: new Date(template.createdAt || Date.now()),
      });
    }

    return NextResponse.json({
      template: {
        id: templateDoc.templateId,
        name: templateDoc.name,
        acknowledge: templateDoc.acknowledge,
        reframe: templateDoc.reframe,
        value: templateDoc.value,
        nextStep: templateDoc.nextStep,
        createdAt: templateDoc.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Save template error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save template' }, { status: 500 });
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
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    await ResponseTemplate.deleteOne({ userId, templateId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete template error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete template' }, { status: 500 });
  }
}

