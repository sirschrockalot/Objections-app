/**
 * Tests for /api/auth/refresh route
 */

// Mock dependencies - MUST be before imports
jest.mock('@/lib/jwt', () => ({
  __esModule: true,
  verifyRefreshToken: jest.fn(), // refresh route uses verifyRefreshToken
  signToken: jest.fn(),
  signRefreshToken: jest.fn(),
}));
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({}),
}));
jest.mock('@/lib/models/User', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));
jest.mock('@/lib/rateLimiter', () => ({
  createRateLimitMiddleware: jest.fn(),
  RATE_LIMITS: {
    auth: { maxRequests: 5, windowMs: 900000 },
    api: { maxRequests: 100, windowMs: 60000 },
    read: { maxRequests: 200, windowMs: 60000 },
  },
}));

// Now import after mocks
import { POST } from '@/app/api/auth/refresh/route';
import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, signToken, signRefreshToken } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { createRateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter';

// Helper to create NextRequest
function createNextRequest(url: string, options: { body?: any; headers?: Record<string, string> } = {}) {
  const { body, headers = {} } = options;
  return new NextRequest(
    new Request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  );
}

describe('/api/auth/refresh', () => {
  const mockRateLimit = {
    allowed: true,
    remaining: 4,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createRateLimitMiddleware as jest.Mock).mockReturnValue(
      jest.fn().mockResolvedValue(mockRateLimit)
    );
    (signToken as jest.Mock).mockReturnValue('new-access-token');
    (signRefreshToken as jest.Mock).mockReturnValue('new-refresh-token');
  });

  it('should return 400 if refresh token is missing', async () => {
    const request = createNextRequest('http://localhost/api/auth/refresh', {
      body: {},
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Refresh token is required');
  });

  it('should return 401 if refresh token is invalid', async () => {
    (verifyRefreshToken as jest.Mock).mockReturnValue(null);

    const request = createNextRequest('http://localhost/api/auth/refresh', {
      body: { refreshToken: 'invalid-token' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid or expired refresh token');
  });

  it('should return 401 if user is inactive', async () => {
    (verifyRefreshToken as jest.Mock).mockReturnValue({
      userId: 'user123',
      isAdmin: false,
      email: 'test@example.com',
    });

    (User.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: 'user123',
        isActive: false,
        isAdmin: false,
        username: 'test@example.com',
      }),
    });

    const request = createNextRequest('http://localhost/api/auth/refresh', {
      body: { refreshToken: 'valid-refresh-token' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('User account is inactive');
  });

  it('should return new access and refresh tokens on valid refresh token', async () => {
    (verifyRefreshToken as jest.Mock).mockReturnValue({
      userId: 'user123',
      isAdmin: false,
      email: 'test@example.com',
    });

    (User.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: 'user123',
        isActive: true,
        isAdmin: false,
        username: 'test@example.com',
      }),
    });

    const request = createNextRequest('http://localhost/api/auth/refresh', {
      body: { refreshToken: 'valid-refresh-token' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.token).toBe('new-access-token');
    expect(data.refreshToken).toBe('new-refresh-token');
    expect(signToken).toHaveBeenCalledWith({
      userId: 'user123',
      isAdmin: false,
      email: 'test@example.com',
    });
    expect(signRefreshToken).toHaveBeenCalledWith({
      userId: 'user123',
      isAdmin: false,
      email: 'test@example.com',
    });
  });

  it('should return 429 if rate limit exceeded', async () => {
    (createRateLimitMiddleware as jest.Mock).mockReturnValue(
      jest.fn().mockResolvedValue({
        allowed: false,
        response: NextResponse.json(
          { error: 'Too many requests' },
          { status: 429 }
        ),
      })
    );

    const request = createNextRequest('http://localhost/api/auth/refresh', {
      body: { refreshToken: 'valid-refresh-token' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe('Too many requests');
  });
});

