/**
 * Tests for /api/data/custom-responses route
 */

// Mock dependencies - MUST be before imports
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({}),
}));
jest.mock('@/lib/models/CustomResponse', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
  },
}));
jest.mock('@/lib/authMiddleware', () => {
  const { NextResponse } = require('next/server');
  return {
    __esModule: true,
    requireAuth: jest.fn(),
    requireAdmin: jest.fn(),
    createAuthErrorResponse: jest.fn((authResult) => {
      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: authResult.statusCode || 401 }
      );
    }),
  };
});
jest.mock('@/lib/rateLimiter', () => ({
  createRateLimitMiddleware: jest.fn(() => jest.fn().mockResolvedValue({ allowed: true, remaining: 99 })),
  RATE_LIMITS: {
    auth: { maxRequests: 5, windowMs: 900000 },
    api: { maxRequests: 100, windowMs: 60000 },
    read: { maxRequests: 200, windowMs: 60000 },
  },
}));
jest.mock('@/lib/inputValidation', () => ({
  sanitizeString: jest.fn((str, maxLength) => str || null),
  sanitizeObjectId: jest.fn((id) => id || null),
}));
jest.mock('@/lib/errorHandler', () => ({
  getSafeErrorMessage: jest.fn((error) => error?.message || 'An error occurred'),
  logError: jest.fn(),
}));

// Now import after mocks
import { GET, POST } from '@/app/api/data/custom-responses/route';
import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import CustomResponse from '@/lib/models/CustomResponse';
import { requireAuth, createAuthErrorResponse } from '@/lib/authMiddleware';
import { createRateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter';
import { getResponseBody } from '@/__tests__/utils/testHelpers';

// Helper to create NextRequest
function createNextRequest(
  url: string,
  options: { method?: string; body?: any; headers?: Record<string, string> } = {}
) {
  const { method = 'GET', body, headers = {} } = options;
  return new NextRequest(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('/api/data/custom-responses', () => {
  const mockRateLimit = {
    allowed: true,
    remaining: 99,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createRateLimitMiddleware as jest.Mock).mockReturnValue(
      jest.fn().mockResolvedValue(mockRateLimit)
    );
    (requireAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      userId: 'user123',
      isAdmin: false,
    });
  });

  describe('GET', () => {
    it('should return 401 if token is missing', async () => {
      (requireAuth as jest.Mock).mockResolvedValue({
        authenticated: false,
        error: 'Authentication required',
        status: 401,
      });

      const request = createNextRequest('http://localhost/api/data/custom-responses');

      const response = await GET(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should return all custom responses for user', async () => {
      const mockResponses = [
        {
          _id: 'response1',
          responseId: 'resp1',
          userId: 'user123',
          objectionId: 'obj1',
          text: 'Custom response 1',
          isCustom: true,
          createdAt: new Date('2024-01-01'),
          upvotes: 0,
          upvotedBy: [],
        },
        {
          _id: 'response2',
          responseId: 'resp2',
          userId: 'user123',
          objectionId: 'obj2',
          text: 'Custom response 2',
          isCustom: true,
          createdAt: new Date('2024-01-02'),
          upvotes: 1,
          upvotedBy: ['user456'],
        },
      ];

      (CustomResponse.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockResponses),
        }),
      });

      const request = createNextRequest('http://localhost/api/data/custom-responses', {
        headers: { 'Authorization': 'Bearer valid-token' },
      });

      const response = await GET(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(data.responses).toHaveLength(2);
      expect(data.responses[0].id).toBe('resp1');
      expect(data.responses[0].objectionId).toBe('obj1');
    });

    it('should filter by objectionId when provided', async () => {
      const mockResponses = [
        {
          _id: 'response1',
          responseId: 'resp1',
          userId: 'user123',
          objectionId: 'obj1',
          text: 'Custom response',
          isCustom: true,
          createdAt: new Date('2024-01-01'),
          upvotes: 0,
          upvotedBy: [],
        },
      ];

      (CustomResponse.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockResponses),
        }),
      });

      const request = createNextRequest('http://localhost/api/data/custom-responses?objectionId=obj1', {
        headers: { 'Authorization': 'Bearer valid-token' },
      });

      const response = await GET(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(CustomResponse.find).toHaveBeenCalledWith(
        expect.objectContaining({ objectionId: 'obj1' })
      );
    });
  });

  describe('POST', () => {
    it('should return 401 if token is missing', async () => {
      (requireAuth as jest.Mock).mockResolvedValue({
        authenticated: false,
        error: 'Authentication required',
        status: 401,
      });

      const request = createNextRequest('http://localhost/api/data/custom-responses', {
        method: 'POST',
        body: { objectionId: 'obj1', text: 'Response text' },
      });

      const response = await POST(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should create a new custom response', async () => {
      const mockResponse = {
        _id: 'response1',
        responseId: 'resp1',
        userId: 'user123',
        objectionId: 'obj1',
        text: 'New response',
        isCustom: true,
        createdAt: new Date('2024-01-01'),
        toObject: jest.fn().mockReturnValue({
          _id: 'response1',
          responseId: 'resp1',
          userId: 'user123',
          objectionId: 'obj1',
          text: 'New response',
          isCustom: true,
          createdAt: new Date('2024-01-01'),
        }),
      };

      (CustomResponse.create as jest.Mock).mockResolvedValue(mockResponse);

      const request = createNextRequest('http://localhost/api/data/custom-responses', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer valid-token' },
        body: { objectionId: 'obj1', response: { id: 'resp1', text: 'New response', isCustom: true } },
      });

      const response = await POST(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(data.response).toBeDefined();
      expect(data.response.text).toBe('New response');
      expect(CustomResponse.create).toHaveBeenCalled();
    });

    it('should return 400 if response is invalid', async () => {
      const request = createNextRequest('http://localhost/api/data/custom-responses', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer valid-token' },
        body: { objectionId: 'obj1' },
      });

      const response = await POST(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
    });
  });
});

