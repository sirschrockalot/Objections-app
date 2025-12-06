/**
 * Integration tests for JWT authentication flow
 */

import { NextRequest } from 'next/server';

// Mock all dependencies first
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/lib/models/User', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('@/lib/models/UserActivity', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('@/lib/jwt', () => ({
  signToken: jest.fn(),
  signRefreshToken: jest.fn(),
  verifyToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
  getTokenFromRequest: jest.fn((request: Request) => {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }),
}));

jest.mock('@/lib/rateLimiter', () => ({
  createRateLimitMiddleware: jest.fn(() => jest.fn().mockResolvedValue({ allowed: true, remaining: 99 })),
  RATE_LIMITS: {
    auth: { maxRequests: 5, windowMs: 15000 },
    api: { maxRequests: 100, windowMs: 60000 },
    read: { maxRequests: 200, windowMs: 60000 },
  },
}));
jest.mock('@/lib/passwordValidation', () => ({
  validatePassword: jest.fn(() => ({ valid: true, error: null })),
}));
jest.mock('@/lib/inputValidation', () => ({
  sanitizeEmail: jest.fn((email) => {
    if (!email) return null;
    const sanitized = String(email).trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized)) return null;
    return sanitized.toLowerCase();
  }),
}));
jest.mock('@/lib/accountLockout', () => ({
  recordFailedAttempt: jest.fn(() => ({ locked: false })),
  clearFailedAttempts: jest.fn(),
  isAccountLocked: jest.fn(() => ({ locked: false })),
}));
jest.mock('@/lib/errorHandler', () => ({
  getSafeErrorMessage: jest.fn((error) => error?.message || 'An error occurred'),
  logError: jest.fn(),
}));
jest.mock('@/lib/authMiddleware', () => ({
  requireAuth: jest.fn(),
  requireAdmin: jest.fn(),
  createAuthErrorResponse: jest.fn((authResult) => {
    const { NextResponse } = require('next/server');
    return NextResponse.json(
      { error: authResult.error || 'Authentication failed' },
      { status: authResult.statusCode || 401 }
    );
  }),
}));

// Import route handlers after mocks
import { POST as loginPOST } from '@/app/api/auth/login/route';
import { POST as registerPOST } from '@/app/api/auth/register/route';
import { GET as meGET } from '@/app/api/auth/me/route';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { signToken, verifyToken } from '@/lib/jwt';
import { requireAuth } from '@/lib/authMiddleware';
import connectDB from '@/lib/mongodb';

describe('JWT Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock connectDB to resolve successfully
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Complete Auth Flow', () => {
    it('should register user, receive token, and use token for authenticated requests', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'test@example.com',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        isActive: true,
        isAdmin: false,
        createdAt: new Date('2024-01-01'),
        toObject: jest.fn().mockReturnValue({
          _id: 'user123',
          username: 'test@example.com',
          email: 'test@example.com',
          isActive: true,
          createdAt: new Date('2024-01-01'),
        }),
      };

      const { sanitizeEmail } = require('@/lib/inputValidation');
      const { validatePassword } = require('@/lib/passwordValidation');
      
      const { signRefreshToken } = require('@/lib/jwt');
      
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (signToken as jest.Mock).mockReturnValue('mock-jwt-token-123');
      (signRefreshToken as jest.Mock).mockReturnValue('mock-refresh-token-123');
      (sanitizeEmail as jest.Mock).mockReturnValue('test@example.com');
      (validatePassword as jest.Mock).mockReturnValue({ valid: true, error: null });

      // Step 1: Register
      const registerRequest = new NextRequest(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'test@example.com',
            password: 'password123',
          }),
        })
      );

      const registerResponse = await registerPOST(registerRequest);
      const registerData = await registerResponse.json();

      expect(registerResponse.status).toBe(201);
      expect(registerData.user).toBeDefined();
      expect(registerData.token).toBe('mock-jwt-token-123');
      expect(signToken).toHaveBeenCalledWith({
        userId: 'user123',
        isAdmin: false,
        email: 'test@example.com',
      });

      // Step 2: Use token for authenticated request
      // Mock requireAuth to return authenticated user
      (requireAuth as jest.Mock).mockResolvedValue({
        authenticated: true,
        userId: 'user123',
        isAdmin: false,
        email: 'test@example.com',
      });

      const meRequest = new NextRequest(
        new Request('http://localhost/api/auth/me', {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer mock-jwt-token-123',
          },
        })
      );

      const meResponse = await meGET(meRequest);
      const meData = await meResponse.json();

      expect(meResponse.status).toBe(200);
      expect(meData.user).toBeDefined();
      expect(meData.user.id).toBe('user123');
      expect(meData.user.email).toBe('test@example.com');
    });

    it('should login user, receive token, and use token for authenticated requests', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'test@example.com',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        isActive: true,
        isAdmin: false,
        createdAt: new Date('2024-01-01'),
        lastLoginAt: new Date('2024-01-01'),
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
      };

      const UserActivity = require('@/lib/models/UserActivity').default;
      const { sanitizeEmail } = require('@/lib/inputValidation');
      const { recordFailedAttempt, clearFailedAttempts, isAccountLocked } = require('@/lib/accountLockout');
      
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (UserActivity.create as jest.Mock).mockResolvedValue({});
      (signToken as jest.Mock).mockReturnValue('mock-jwt-token-456');
      (sanitizeEmail as jest.Mock).mockReturnValue('test@example.com');
      (isAccountLocked as jest.Mock).mockReturnValue({ locked: false });
      (recordFailedAttempt as jest.Mock).mockReturnValue({ locked: false });
      (clearFailedAttempts as jest.Mock).mockReturnValue(undefined);

      // Step 1: Login
      const loginRequest = new NextRequest(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'test@example.com',
            password: 'password123',
          }),
        })
      );

      const loginResponse = await loginPOST(loginRequest);
      const loginData = await loginResponse.json();

      expect(loginResponse.status).toBe(200);
      expect(loginData.user).toBeDefined();
      expect(loginData.token).toBe('mock-jwt-token-456');
      expect(signToken).toHaveBeenCalledWith({
        userId: 'user123',
        isAdmin: false,
        email: 'test@example.com',
      });

      // Step 2: Use token for authenticated request
      // Mock requireAuth to return authenticated user
      (requireAuth as jest.Mock).mockResolvedValue({
        authenticated: true,
        userId: 'user123',
        isAdmin: false,
        email: 'test@example.com',
      });

      const meRequest = new NextRequest(
        new Request('http://localhost/api/auth/me', {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer mock-jwt-token-456',
          },
        })
      );

      const meResponse = await meGET(meRequest);
      const meData = await meResponse.json();

      expect(meResponse.status).toBe(200);
      expect(meData.user).toBeDefined();
      expect(meData.user.id).toBe('user123');
      expect(meData.user.email).toBe('test@example.com');
    });

    it('should reject requests without token', async () => {
      (requireAuth as jest.Mock).mockResolvedValue({
        authenticated: false,
        error: 'Authentication required',
        statusCode: 401,
      });

      const meRequest = new NextRequest(
        new Request('http://localhost/api/auth/me', {
          method: 'GET',
        })
      );

      const meResponse = await meGET(meRequest);
      const meData = await meResponse.json();

      expect(meResponse.status).toBe(401);
      expect(meData.error).toBeDefined();
    });

    it('should reject requests with invalid token', async () => {
      (requireAuth as jest.Mock).mockResolvedValue({
        authenticated: false,
        error: 'Invalid or expired token',
        statusCode: 401,
      });

      const meRequest = new NextRequest(
        new Request('http://localhost/api/auth/me', {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer invalid-token',
          },
        })
      );

      const meResponse = await meGET(meRequest);
      const meData = await meResponse.json();

      expect(meResponse.status).toBe(401);
      expect(meData.error).toContain('Invalid or expired token');
    });
  });

  describe('Token Security', () => {
    it('should include user ID and admin status in token', async () => {
      const mockUser = {
        _id: 'admin123',
        username: 'admin@example.com',
        email: 'admin@example.com',
        passwordHash: 'hashedpassword',
        isActive: true,
        isAdmin: true,
        createdAt: new Date('2024-01-01'),
        lastLoginAt: new Date('2024-01-01'),
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
      };

      const UserActivity = require('@/lib/models/UserActivity').default;
      const { sanitizeEmail } = require('@/lib/inputValidation');
      const { recordFailedAttempt, clearFailedAttempts, isAccountLocked } = require('@/lib/accountLockout');
      
      const { signRefreshToken } = require('@/lib/jwt');
      
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (UserActivity.create as jest.Mock).mockResolvedValue({});
      (signToken as jest.Mock).mockReturnValue('admin-token');
      (signRefreshToken as jest.Mock).mockReturnValue('admin-refresh-token');
      (sanitizeEmail as jest.Mock).mockReturnValue('admin@example.com');
      (isAccountLocked as jest.Mock).mockReturnValue({ locked: false });
      (recordFailedAttempt as jest.Mock).mockReturnValue({ locked: false });
      (clearFailedAttempts as jest.Mock).mockReturnValue(undefined);

      const loginRequest = new NextRequest(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'admin@example.com',
            password: 'password123',
          }),
        })
      );

      const loginResponse = await loginPOST(loginRequest);
      const loginData = await loginResponse.json();
      
      // Debug: Check response if login failed
      if (loginResponse.status !== 200) {
        console.log('Login failed with status:', loginResponse.status, 'Error:', JSON.stringify(loginData, null, 2));
      }

      expect(loginResponse.status).toBe(200);
      expect(signToken).toHaveBeenCalledWith({
        userId: 'admin123',
        isAdmin: true,
        email: 'admin@example.com',
      });
    });
  });
});
