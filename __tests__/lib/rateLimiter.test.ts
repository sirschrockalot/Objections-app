/**
 * Tests for rate limiting utilities
 */

// Mock dependencies - MUST be before imports
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({}),
}));
// Mock node-cache with actual state tracking
const mockCacheStore = new Map<string, { value: any; ttl: number }>();
jest.mock('node-cache', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn((key: string) => {
      const entry = mockCacheStore.get(key);
      if (!entry) return undefined;
      // Check if expired
      if (entry.ttl > 0 && Date.now() > entry.ttl) {
        mockCacheStore.delete(key);
        return undefined;
      }
      return entry.value;
    }),
    set: jest.fn((key: string, value: any, ttl?: number) => {
      const expiresAt = ttl ? Date.now() + (ttl * 1000) : 0;
      mockCacheStore.set(key, { value, ttl: expiresAt });
      return true;
    }),
    del: jest.fn((key: string) => {
      mockCacheStore.delete(key);
      return 1;
    }),
  }));
});
jest.mock('mongoose', () => {
  const MockSchema = class {
    constructor(definition: any, options?: any) {}
    index() { return this; }
  };
  return {
    models: {},
    model: jest.fn(() => ({
      findOne: jest.fn().mockResolvedValue(null),
      findOneAndUpdate: jest.fn().mockResolvedValue(null),
    })),
    Schema: MockSchema,
    Types: {
      Mixed: {},
    },
  };
});

// Import NextResponse before importing rateLimiter (which uses it)
import { NextRequest, NextResponse } from 'next/server';

// Now import the functions we're testing
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitMiddleware } from '@/lib/rateLimiter';

// Import the rate limit store to clear it
// Note: We can't directly access the private store, so we'll use unique identifiers per test
describe('Rate Limiter', () => {
  beforeEach(() => {
    // Clear rate limit store before each test
    jest.clearAllMocks();
    mockCacheStore.clear();
    // Use unique identifiers for each test to avoid interference
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', async () => {
      const config = { maxRequests: 5, windowMs: 60000 };
      const identifier = 'test-ip-unique-1';

      // Make 3 requests
      for (let i = 0; i < 3; i++) {
        const result = await checkRateLimit(`${identifier}-${i}`, config);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBeGreaterThanOrEqual(0);
      }
    });

    it('should block requests exceeding limit', async () => {
      const config = { maxRequests: 2, windowMs: 60000 };
      const identifier = 'test-ip-unique-2';

      // Make 2 requests (should be allowed)
      const result1 = await checkRateLimit(identifier, config);
      expect(result1.allowed).toBe(true);
      const result2 = await checkRateLimit(identifier, config);
      expect(result2.allowed).toBe(true);

      // Third request should be blocked
      const result3 = await checkRateLimit(identifier, config);
      expect(result3.allowed).toBe(false);
      expect(result3.remaining).toBe(0);
    });

    it('should reset after window expires', async () => {
      const config = { maxRequests: 2, windowMs: 200 }; // 200ms window
      const identifier = 'test-ip-unique-3';

      // Exhaust limit
      await checkRateLimit(identifier, config);
      await checkRateLimit(identifier, config);
      const blocked = await checkRateLimit(identifier, config);
      expect(blocked.allowed).toBe(false);

      // Wait for window to expire (add buffer)
      await new Promise(resolve => setTimeout(resolve, 250));

      // Should be allowed again (new window)
      const allowed = await checkRateLimit(identifier, config);
      expect(allowed.allowed).toBe(true);
    });
  });

  describe('getClientIdentifier', () => {
    it('should use user ID if provided', () => {
      const request = new NextRequest(new Request('http://localhost'));
      const identifier = getClientIdentifier(request, 'user123');

      expect(identifier).toBe('user:user123');
    });

    it('should use IP address if no user ID', () => {
      const request = new NextRequest('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      });
      const identifier = getClientIdentifier(request);

      expect(identifier).toBe('ip:192.168.1.1');
    });

    it('should use x-real-ip if x-forwarded-for not available', () => {
      const request = new NextRequest('http://localhost', {
        headers: {
          'x-real-ip': '10.0.0.1',
        },
      });
      const identifier = getClientIdentifier(request);

      expect(identifier).toBe('ip:10.0.0.1');
    });

    it('should use "unknown" if no IP available', () => {
      const request = new NextRequest('http://localhost');
      const identifier = getClientIdentifier(request);

      expect(identifier).toBe('ip:unknown');
    });
  });

  describe('createRateLimitMiddleware', () => {
    it('should create middleware that enforces rate limits', async () => {
      const middleware = createRateLimitMiddleware({ maxRequests: 2, windowMs: 60000 });
      const request = new NextRequest('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.100',
        },
      });

      // First request should be allowed
      const result1 = await middleware(request);
      expect(result1.allowed).toBe(true);

      // Second request should be allowed
      const result2 = await middleware(request);
      expect(result2.allowed).toBe(true);

      // Third request should be blocked
      const result3 = await middleware(request);
      expect(result3.allowed).toBe(false);
      expect(result3.response).toBeDefined();
      if (result3.response) {
        const responseData = await result3.response.json();
        expect(responseData?.error).toContain('Too many requests');
      }
    });
  });

  describe('RATE_LIMITS constants', () => {
    it('should have appropriate limits for auth endpoints', () => {
      expect(RATE_LIMITS.auth.maxRequests).toBe(5);
      expect(RATE_LIMITS.auth.windowMs).toBe(15 * 60 * 1000);
    });

    it('should have appropriate limits for API endpoints', () => {
      expect(RATE_LIMITS.api.maxRequests).toBe(100);
      expect(RATE_LIMITS.api.windowMs).toBe(60 * 1000);
    });

    it('should have appropriate limits for read endpoints', () => {
      expect(RATE_LIMITS.read.maxRequests).toBe(200);
      expect(RATE_LIMITS.read.windowMs).toBe(60 * 1000);
    });
  });
});

