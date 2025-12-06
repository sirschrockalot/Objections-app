/**
 * Tests for /api/auth/login route
 */

// Mock dependencies - MUST be before imports
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({}),
}));
jest.mock('@/lib/models/User', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));
jest.mock('@/lib/models/UserActivity', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
  },
}));
jest.mock('@/lib/jwt', () => ({
  signToken: jest.fn(),
  signRefreshToken: jest.fn(),
  verifyToken: jest.fn(),
}));
jest.mock('@/lib/rateLimiter', () => ({
  __esModule: true,
  createRateLimitMiddleware: jest.fn(() => jest.fn().mockResolvedValue({ allowed: true, remaining: 99 })),
  RATE_LIMITS: {
    auth: { maxRequests: 5, windowMs: 900000 },
    api: { maxRequests: 100, windowMs: 60000 },
    read: { maxRequests: 200, windowMs: 60000 },
  },
}));
jest.mock('@/lib/accountLockout', () => ({
  recordFailedAttempt: jest.fn(() => ({ locked: false })),
  clearFailedAttempts: jest.fn(),
  isAccountLocked: jest.fn(() => ({ locked: false })),
}));
jest.mock('@/lib/inputValidation', () => ({
  sanitizeEmail: jest.fn((email) => email || null),
}));
jest.mock('@/lib/errorHandler', () => ({
  getSafeErrorMessage: jest.fn((error) => error?.message || 'An error occurred'),
  logError: jest.fn(),
}));

// Now import after mocks
import { POST } from '@/app/api/auth/login/route';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import UserActivity from '@/lib/models/UserActivity';
import { signToken, signRefreshToken } from '@/lib/jwt';
import { createRateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter';
import { recordFailedAttempt, clearFailedAttempts, isAccountLocked } from '@/lib/accountLockout';
import { sanitizeEmail } from '@/lib/inputValidation';

// Helper to create NextRequest
function createNextRequest(url: string, options: { method?: string; body?: any; headers?: Record<string, string> } = {}) {
  const { method = 'GET', body, headers = {} } = options;
  return new NextRequest(
    new Request(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  );
}

describe('/api/auth/login', () => {
  const mockRateLimit = {
    allowed: true,
    remaining: 4,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createRateLimitMiddleware as jest.Mock).mockReturnValue(
      jest.fn().mockResolvedValue(mockRateLimit)
    );
    (signToken as jest.Mock).mockReturnValue('mock-jwt-token');
    (signRefreshToken as jest.Mock).mockReturnValue('mock-refresh-token');
    (sanitizeEmail as jest.Mock).mockImplementation((email) => {
      // Match actual sanitizeEmail implementation - must pass regex
      if (!email) return null;
      const sanitized = String(email).trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitized)) return null;
      return sanitized.toLowerCase();
    });
    (isAccountLocked as jest.Mock).mockReturnValue({ locked: false });
    (recordFailedAttempt as jest.Mock).mockReturnValue({ locked: false });
    (clearFailedAttempts as jest.Mock).mockReturnValue(undefined);
  });

  it('should return 400 if username is missing', async () => {
    const request = createNextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: { password: 'password123' },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    
    const data = await response.json().catch(() => ({}));
    expect(data.error).toBe('Username and password are required');
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

    const request = createNextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: {
        username: 'test@example.com',
        password: 'password123',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe('Too many requests');
  });

  it('should return 400 if password is missing', async () => {
    const request = createNextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: { username: 'test@example.com' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Username and password are required');
  });

  it('should return 401 if user does not exist', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);
    (sanitizeEmail as jest.Mock).mockReturnValue('nonexistent@example.com');

    const request = createNextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: {
        username: 'nonexistent@example.com',
        password: 'password123',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid username or password');
    expect(User.findOne).toHaveBeenCalledWith({
      username: 'nonexistent@example.com',
      isActive: true,
    });
  });

  it('should return 401 if password is incorrect', async () => {
    const mockUser = {
      _id: 'user123',
      username: 'test@example.com',
      email: 'test@example.com',
      comparePassword: jest.fn().mockResolvedValue(false),
      lastLoginAt: null,
      save: jest.fn().mockResolvedValue(true),
    };

    (User.findOne as jest.Mock).mockResolvedValue(mockUser);

    const request = createNextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: {
        username: 'test@example.com',
        password: 'wrongpassword',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid username or password');
    expect(mockUser.comparePassword).toHaveBeenCalledWith('wrongpassword');
  });

  it('should successfully login with correct credentials', async () => {
    const mockUser = {
      _id: 'user123',
      username: 'test@example.com',
      email: 'test@example.com',
      createdAt: new Date('2024-01-01'),
      lastLoginAt: null,
      isActive: true,
      isAdmin: false,
      mustChangePassword: false,
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true),
    };

    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    (UserActivity.create as jest.Mock).mockResolvedValue({});
    // sanitizeEmail is already mocked in beforeEach with implementation

    const request = createNextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      headers: {
        'user-agent': 'test-agent',
        referer: 'http://localhost',
      },
      body: {
        username: 'test@example.com',
        password: 'correctpassword',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toBeDefined();
    expect(data.user.id).toBe('user123');
    expect(data.user.username).toBe('test@example.com');
    expect(data.user.passwordHash).toBeUndefined();
    expect(data.token).toBe('mock-jwt-token');
    expect(data.refreshToken).toBe('mock-refresh-token');
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
    expect(mockUser.save).toHaveBeenCalled();
    expect(UserActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user123',
        action: 'login',
      })
    );
  });

  it('should return 401 if user is inactive', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);
    (sanitizeEmail as jest.Mock).mockReturnValue('inactive@example.com');

    const request = createNextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: {
        username: 'inactive@example.com',
        password: 'password123',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid username or password');
  });

  it('should handle server errors gracefully', async () => {
    const { getSafeErrorMessage, logError } = require('@/lib/errorHandler');
    (getSafeErrorMessage as jest.Mock).mockReturnValue('Login failed. Please try again later.');
    (sanitizeEmail as jest.Mock).mockReturnValue('test@example.com');
    (User.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = createNextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: {
        username: 'test@example.com',
        password: 'password123',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Login failed. Please try again later.');
    expect(logError).toHaveBeenCalled();
  });
});

