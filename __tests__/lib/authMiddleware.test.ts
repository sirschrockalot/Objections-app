/**
 * Tests for authentication middleware
 */

// Mock dependencies - MUST be before imports
jest.mock('@/lib/jwt', () => ({
  verifyToken: jest.fn(),
  getTokenFromRequest: jest.fn(),
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

// Now import after mocks
import { requireAuth, requireAdmin, createAuthErrorResponse } from '@/lib/authMiddleware';
import { NextRequest } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

// Helper to create NextRequest
function createNextRequest(url: string, options: { headers?: Record<string, string> } = {}) {
  const { headers = {} } = options;
  return new NextRequest(
    new Request(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    })
  );
}

describe('Authentication Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('should return error if no token provided', async () => {
      (getTokenFromRequest as jest.Mock).mockReturnValue(null);

      const request = createNextRequest('http://localhost/api/test');
      const result = await requireAuth(request);

      expect(result.authenticated).toBe(false);
      expect(result.error).toBe('Authentication required');
      expect(result.statusCode).toBe(401);
    });

    it('should return error if token is invalid', async () => {
      (getTokenFromRequest as jest.Mock).mockReturnValue('invalid-token');
      (verifyToken as jest.Mock).mockReturnValue(null);

      const request = createNextRequest('http://localhost/api/test', {
        headers: { Authorization: 'Bearer invalid-token' },
      });
      const result = await requireAuth(request);

      expect(result.authenticated).toBe(false);
      expect(result.error).toBe('Invalid or expired token');
      expect(result.statusCode).toBe(401);
    });

    it('should return authenticated user if token is valid', async () => {
      const mockPayload = {
        userId: 'user123',
        isAdmin: false,
        email: 'test@example.com',
      };

      (getTokenFromRequest as jest.Mock).mockReturnValue('valid-token');
      (verifyToken as jest.Mock).mockReturnValue(mockPayload);
      (User.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'user123',
          isActive: true,
          isAdmin: false,
        }),
      });

      const request = createNextRequest('http://localhost/api/test', {
        headers: { Authorization: 'Bearer valid-token' },
      });
      const result = await requireAuth(request);

      expect(result.authenticated).toBe(true);
      expect(result.userId).toBe('user123');
      expect(result.isAdmin).toBe(false);
    });

    it('should return error if user is inactive', async () => {
      const mockPayload = {
        userId: 'user123',
        isAdmin: false,
        email: 'test@example.com',
      };

      (getTokenFromRequest as jest.Mock).mockReturnValue('valid-token');
      (verifyToken as jest.Mock).mockReturnValue(mockPayload);
      (User.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'user123',
          isActive: false,
          isAdmin: false,
        }),
      });

      const request = createNextRequest('http://localhost/api/test', {
        headers: { Authorization: 'Bearer valid-token' },
      });
      const result = await requireAuth(request);

      expect(result.authenticated).toBe(false);
      expect(result.error).toBe('User account is inactive');
    });
  });

  describe('requireAdmin', () => {
    it('should return error if not authenticated', async () => {
      (getTokenFromRequest as jest.Mock).mockReturnValue(null);

      const request = createNextRequest('http://localhost/api/admin');
      const result = await requireAdmin(request);

      expect(result.authenticated).toBe(false);
      expect(result.statusCode).toBe(401);
    });

    it('should return error if user is not admin', async () => {
      const mockPayload = {
        userId: 'user123',
        isAdmin: false,
        email: 'test@example.com',
      };

      (getTokenFromRequest as jest.Mock).mockReturnValue('valid-token');
      (verifyToken as jest.Mock).mockReturnValue(mockPayload);
      (User.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'user123',
          isActive: true,
          isAdmin: false,
        }),
      });

      const request = createNextRequest('http://localhost/api/admin', {
        headers: { Authorization: 'Bearer valid-token' },
      });
      const result = await requireAdmin(request);

      expect(result.authenticated).toBe(false);
      expect(result.error).toBe('Admin access required');
      expect(result.statusCode).toBe(403);
    });

    it('should return authenticated admin if user is admin', async () => {
      const mockPayload = {
        userId: 'admin123',
        isAdmin: true,
        email: 'admin@example.com',
      };

      (getTokenFromRequest as jest.Mock).mockReturnValue('valid-token');
      (verifyToken as jest.Mock).mockReturnValue(mockPayload);
      (User.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'admin123',
          isActive: true,
          isAdmin: true,
        }),
      });

      const request = createNextRequest('http://localhost/api/admin', {
        headers: { Authorization: 'Bearer valid-token' },
      });
      const result = await requireAdmin(request);

      expect(result.authenticated).toBe(true);
      expect(result.userId).toBe('admin123');
      expect(result.isAdmin).toBe(true);
    });
  });

  describe('createAuthErrorResponse', () => {
    it('should create error response with correct status code', () => {
      const authResult = {
        authenticated: false,
        error: 'Authentication required',
        statusCode: 401,
      };

      const response = createAuthErrorResponse(authResult);
      expect(response.status).toBe(401);
    });
  });
});

