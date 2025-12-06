/**
 * Tests for JWT utilities
 */

import { signToken, verifyToken, getTokenFromRequest, isTokenExpired } from '@/lib/jwt';

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload, secret, options) => {
    return `mock-token-${payload.userId}`;
  }),
  verify: jest.fn((token, secret) => {
    if (token === 'invalid-token') {
      throw new Error('Invalid token');
    }
    if (token === 'expired-token') {
      return { userId: 'user123', isAdmin: false, email: 'test@example.com', exp: Math.floor(Date.now() / 1000) - 100 };
    }
    return { userId: 'user123', isAdmin: false, email: 'test@example.com', exp: Math.floor(Date.now() / 1000) + 3600 };
  }),
  decode: jest.fn((token) => {
    if (token === 'expired-token') {
      return { userId: 'user123', exp: Math.floor(Date.now() / 1000) - 100 };
    }
    return { userId: 'user123', exp: Math.floor(Date.now() / 1000) + 3600 };
  }),
}));

describe('JWT Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signToken', () => {
    it('should sign a token with user information', () => {
      const payload = {
        userId: 'user123',
        isAdmin: false,
        email: 'test@example.com',
      };

      const token = signToken(payload);

      expect(token).toBe('mock-token-user123');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = 'valid-token';
      const payload = verifyToken(token);

      expect(payload).toBeDefined();
      expect(payload?.userId).toBe('user123');
    });

    it('should return null for invalid token', () => {
      const token = 'invalid-token';
      const payload = verifyToken(token);

      expect(payload).toBeNull();
    });
  });

  describe('getTokenFromRequest', () => {
    it('should extract token from Authorization header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'Authorization': 'Bearer test-token-123',
        },
      });

      const token = getTokenFromRequest(request);

      expect(token).toBe('test-token-123');
    });

    it('should return null if no Authorization header', () => {
      const request = new Request('http://localhost');
      const token = getTokenFromRequest(request);

      expect(token).toBeNull();
    });

    it('should return null if Authorization header does not start with Bearer', () => {
      const request = new Request('http://localhost', {
        headers: {
          'Authorization': 'Token test-token-123',
        },
      });

      const token = getTokenFromRequest(request);

      expect(token).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return true for expired token', () => {
      const expired = isTokenExpired('expired-token');
      expect(expired).toBe(true);
    });

    it('should return false for valid token', () => {
      const expired = isTokenExpired('valid-token');
      expect(expired).toBe(false);
    });
  });
});

