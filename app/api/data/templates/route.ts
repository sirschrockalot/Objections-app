import { NextRequest, NextResponse } from 'next/server';
import ResponseTemplate from '@/lib/models/ResponseTemplate';
import { createApiHandler } from '@/lib/api/routeHandler';
import { RATE_LIMITS } from '@/lib/rateLimiter';
import { formatTemplate } from '@/lib/api/responseFormatters';

export const GET = createApiHandler({
  rateLimit: RATE_LIMITS.read,
  requireAuth: true,
  errorContext: 'Get templates',
  handler: async (req, { userId }) => {
    const templates = await ResponseTemplate.find({ userId }).sort({ createdAt: -1 }).lean();
    return { templates: templates.map(formatTemplate) };
  },
});

export const POST = createApiHandler({
  rateLimit: RATE_LIMITS.read,
  requireAuth: true,
  errorContext: 'Save template',
  handler: async (req, { userId }) => {
    const body = await req.json();
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

    return { template: formatTemplate(templateDoc) };
  },
});

export const DELETE = createApiHandler({
  rateLimit: RATE_LIMITS.read,
  requireAuth: true,
  errorContext: 'Delete template',
  handler: async (req, { userId }) => {
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    await ResponseTemplate.deleteOne({ userId, templateId });
    return { success: true };
  },
});

