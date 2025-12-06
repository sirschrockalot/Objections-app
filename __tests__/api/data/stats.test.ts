/**
 * Tests for /api/data/stats route
 */

// Mock dependencies - MUST be before imports
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({}),
}));
jest.mock('@/lib/models/PracticeSession', () => ({
  __esModule: true,
  default: {
    find: jest.fn(() => ({
      lean: jest.fn(),
    })),
  },
}));
jest.mock('@/lib/models/ConfidenceRating', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}));
jest.mock('@/lib/models/ReviewSchedule', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}));
jest.mock('@/lib/models/Points', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
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
  __esModule: true,
  createRateLimitMiddleware: jest.fn(() => jest.fn().mockResolvedValue({ allowed: true, remaining: 99 })),
  RATE_LIMITS: {
    auth: { maxRequests: 5, windowMs: 900000 },
    api: { maxRequests: 100, windowMs: 60000 },
    read: { maxRequests: 200, windowMs: 60000 },
  },
}));
jest.mock('@/data/objections', () => ({
  initialObjections: [
    { id: '1', text: 'Objection 1', category: 'Price' },
    { id: '2', text: 'Objection 2', category: 'Timing' },
  ],
}));

// Now import after mocks
import { GET } from '@/app/api/data/stats/route';
import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import PracticeSession from '@/lib/models/PracticeSession';
import ConfidenceRating from '@/lib/models/ConfidenceRating';
import ReviewSchedule from '@/lib/models/ReviewSchedule';
import Points from '@/lib/models/Points';
import { requireAuth, createAuthErrorResponse } from '@/lib/authMiddleware';
import { createRateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter';
import { getResponseBody } from '@/__tests__/utils/testHelpers';

// Helper to create NextRequest
function createNextRequest(url: string, options: { headers?: Record<string, string> } = {}) {
  const { headers = {} } = options;
  return new NextRequest(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

describe('/api/data/stats', () => {
  const mockRateLimit = {
    allowed: true,
    remaining: 99,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock to return a function that resolves to mockRateLimit
    (createRateLimitMiddleware as jest.Mock).mockReturnValue(
      jest.fn().mockResolvedValue(mockRateLimit)
    );
    (requireAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      userId: 'user123',
      isAdmin: false,
    });
  });

  it('should return 401 if token is missing', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      authenticated: false,
      error: 'Authentication required',
      statusCode: 401,
    });

    const request = createNextRequest('http://localhost/api/data/stats');

    const response = await GET(request);
    const data = await getResponseBody(response);

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });

  it('should return comprehensive stats for authenticated user', async () => {
    const mockSessions = [
      {
        _id: 'session1',
        userId: 'user123',
        date: new Date('2024-01-01'),
        objectionsPracticed: ['1', '2'],
        duration: 300,
      },
    ];

    const mockRatings = [
      {
        _id: 'rating1',
        userId: 'user123',
        objectionId: '1',
        rating: 4,
        date: new Date('2024-01-01'),
      },
    ];

    const mockSchedules = [
      {
        _id: 'schedule1',
        userId: 'user123',
        objectionId: '1',
        nextReviewDate: '2024-01-15',
        interval: 7,
        easeFactor: 2.5,
        isDue: false,
      },
    ];

    const mockPoints = [
      {
        _id: 'points1',
        userId: 'user123',
        points: 10,
        date: new Date('2024-01-01'),
      },
    ];

    (PracticeSession.find as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockSessions),
    });

    (ConfidenceRating.find as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockRatings),
    });

    (ReviewSchedule.find as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockSchedules),
    });

    (Points.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockPoints),
      }),
    });

    const request = createNextRequest('http://localhost/api/data/stats', {
      headers: { 'Authorization': 'Bearer valid-token' },
    });

    const response = await GET(request);
    const data = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(data.totalSessions).toBe(1);
    expect(data.totalObjectionsPracticed).toBe(2);
    expect(data.totalPoints).toBe(10);
    expect(data.userLevel).toBeDefined();
    expect(data.spacedRepetition).toBeDefined();
    expect(data.categoryMastery).toBeDefined();
  });

  it('should handle empty data gracefully', async () => {
    (PracticeSession.find as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue([]),
    });

    (ConfidenceRating.find as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue([]),
    });

    (ReviewSchedule.find as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue([]),
    });

    (Points.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });

    const request = createNextRequest('http://localhost/api/data/stats', {
      headers: { 'Authorization': 'Bearer valid-token' },
    });

    const response = await GET(request);
    const data = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(data.totalSessions).toBe(0);
    expect(data.totalObjectionsPracticed).toBe(0);
    expect(data.streak).toBe(0);
  });

  it('should handle server errors gracefully', async () => {
    (PracticeSession.find as jest.Mock).mockReturnValue({
      lean: jest.fn().mockRejectedValue(new Error('Database error')),
    });

    const request = createNextRequest('http://localhost/api/data/stats', {
      headers: { 'Authorization': 'Bearer valid-token' },
    });

    const response = await GET(request);
    const data = await getResponseBody(response);

    expect(response.status).toBe(500);
    expect(data.error).toBe('Database error');
  });
});

