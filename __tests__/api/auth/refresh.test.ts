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
    findById: jest.fn(() => ({
      lean: jest.fn(),
    })),
  },
}));
jest.mock('@/lib/rateLimiter', () => ({
  createRateLimitMiddleware: jest.fn(() => jest.fn().mockResolvedValue({ allowed: true, remaining: 99 })),
  RATE_LIMITS: {
    auth: { maxRequests: 5, windowMs: 900000 },
    api: { maxRequests: 100, windowMs: 60000 },
    read: { maxRequests: 200, windowMs: 60000 },
  },
}));
jest.mock('@/lib/api/routeHandler', () => {
  const { NextResponse } = require('next/server');
  return {
    createApiHandler: jest.fn((options) => {
      // Return a handler that executes the handler function directly for testing
      // This bypasses rate limiting and auth checks for unit testing
      return async (request: any) => {
        try {
          // Ensure request.json() is available
          if (!request.json) {
            request.json = async () => {
              try {
                const text = await request.text();
                return text ? JSON.parse(text) : {};
              } catch {
                return {};
              }
            };
          }
          
          // Skip rate limiting and auth for testing - execute handler directly
          const context = {
            userId: '',
            isAdmin: false,
            email: undefined,
            rateLimitRemaining: 99,
            request,
          };
          const result = await options.handler(request, context);
          // If handler returns NextResponse, return it; otherwise wrap in NextResponse
          if (result && typeof result === 'object' && 'status' in result && 'json' in result) {
            return result;
          }
          return NextResponse.json(result);
        } catch (error: any) {
          return NextResponse.json(
            { error: error.message || 'An error occurred' },
            { status: 500 }
          );
        }
      };
    }),
  };
});

// Now import after mocks
import { POST } from '@/app/api/auth/refresh/route';
import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, signToken, signRefreshToken } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { createRateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter';
import { getResponseBody } from '@/__tests__/utils/testHelpers';

// Helper to create NextRequest
function createNextRequest(url: string, options: { body?: any; headers?: Record<string, string> } = {}) {
  const { body, headers = {} } = options;
  return new NextRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('/api/auth/refresh', () => {
  const mockRateLimit = {
    allowed: true,
    remaining: 4,
  };

  const mockRateLimitMiddleware = jest.fn().mockResolvedValue(mockRateLimit);

  beforeEach(() => {
    jest.clearAllMocks();
    (createRateLimitMiddleware as jest.Mock).mockReturnValue(mockRateLimitMiddleware);
    (signToken as jest.Mock).mockReturnValue('new-access-token');
    (signRefreshToken as jest.Mock).mockReturnValue('new-refresh-token');
  });

  it('should return 400 if refresh token is missing', async () => {
    const request = createNextRequest('http://localhost/api/auth/refresh', {
      body: {},
    });

    const response = await POST(request);
    const data = await getResponseBody(response);

    expect(response.status).toBe(400);
    expect(data.error).toBe('Refresh token is required');
  });

  it('should return 401 if refresh token is invalid', async () => {
    (verifyRefreshToken as jest.Mock).mockReturnValue(null);

    const request = createNextRequest('http://localhost/api/auth/refresh', {
      body: { refreshToken: 'invalid-token' },
    });

    const response = await POST(request);
    const data = await getResponseBody(response);

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
    const data = await getResponseBody(response);

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
    
    await connectDB();

    const request = createNextRequest('http://localhost/api/auth/refresh', {
      body: { refreshToken: 'valid-refresh-token' },
    });

    const response = await POST(request);
    const data = await getResponseBody(response);

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

});

