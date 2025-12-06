/**
 * Tests for /api/auth/users route (admin user management)
 */

// Mock dependencies - MUST be before imports
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({}),
}));
jest.mock('@/lib/models/User', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  },
}));
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
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
  createRateLimitMiddleware: jest.fn(),
  RATE_LIMITS: {
    auth: { maxRequests: 5, windowMs: 900000 },
    api: { maxRequests: 100, windowMs: 60000 },
    read: { maxRequests: 200, windowMs: 60000 },
  },
}));
jest.mock('@/lib/passwordValidation', () => ({
  validatePassword: jest.fn(() => ({ valid: true, error: null })),
}));
jest.mock('@/lib/inputValidation', () => ({
  sanitizeEmail: jest.fn((email) => email || null),
  sanitizeString: jest.fn((str) => str || null),
}));
jest.mock('@/lib/errorHandler', () => ({
  getSafeErrorMessage: jest.fn((error) => error?.message || 'An error occurred'),
  logError: jest.fn(),
}));

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

// Import after mocks
import { GET, POST } from '@/app/api/auth/users/route';
import { requireAdmin, createAuthErrorResponse } from '@/lib/authMiddleware';

describe('/api/auth/users', () => {
  const mockRateLimit = {
    allowed: true,
    remaining: 99,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createRateLimitMiddleware as jest.Mock).mockReturnValue(
      jest.fn().mockResolvedValue(mockRateLimit)
    );
    (requireAdmin as jest.Mock).mockResolvedValue({
      authenticated: true,
      userId: 'admin123',
      isAdmin: true,
    });
  });

  describe('GET - List users', () => {
    it('should return 403 if user is not admin', async () => {
      (requireAdmin as jest.Mock).mockResolvedValue({
        authenticated: false,
        error: 'Admin access required',
        statusCode: 403,
      });

      const request = createNextRequest('http://localhost/api/auth/users', {
        headers: { Authorization: 'Bearer token' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Admin access required');
    });

    it('should return 401 if no token provided', async () => {
      (requireAdmin as jest.Mock).mockResolvedValue({
        authenticated: false,
        error: 'Authentication required',
        statusCode: 401,
      });

      const request = createNextRequest('http://localhost/api/auth/users');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should return list of users for admin', async () => {
      const mockUsers = [
        {
          _id: 'user1',
          username: 'user1@example.com',
          email: 'user1@example.com',
          isActive: true,
          isAdmin: false,
          createdAt: new Date('2024-01-01'),
        },
        {
          _id: 'user2',
          username: 'user2@example.com',
          email: 'user2@example.com',
          isActive: true,
          isAdmin: false,
          createdAt: new Date('2024-01-02'),
        },
      ];

      (requireAdmin as jest.Mock).mockResolvedValue({
        authenticated: true,
        userId: 'admin123',
        isAdmin: true,
      });

      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockUsers),
        }),
      });

      const request = createNextRequest('http://localhost/api/auth/users', {
        headers: { Authorization: 'Bearer admin-token' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.users).toHaveLength(2);
      expect(data.users[0].id).toBe('user1');
    });
  });

  describe('POST - Create user', () => {
    it('should return 403 if user is not admin', async () => {
      (requireAdmin as jest.Mock).mockResolvedValue({
        authenticated: false,
        error: 'Admin access required',
        statusCode: 403,
      });

      const request = createNextRequest('http://localhost/api/auth/users', {
        method: 'POST',
        headers: { Authorization: 'Bearer token' },
        body: {
          username: 'newuser@example.com',
          password: 'Password123!@#',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Admin access required');
    });

    it('should return 400 if username is not a valid email', async () => {
      (requireAdmin as jest.Mock).mockResolvedValue({
        authenticated: true,
        userId: 'admin123',
        isAdmin: true,
      });

      const request = createNextRequest('http://localhost/api/auth/users', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer admin-token' },
        body: {
          username: 'notanemail',
          password: 'Password123!@#',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Username must be a valid email address');
    });

    it('should return 400 if password is too short', async () => {
      (requireAdmin as jest.Mock).mockResolvedValue({
        authenticated: true,
        userId: 'admin123',
        isAdmin: true,
      });

      const request = createNextRequest('http://localhost/api/auth/users', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer admin-token' },
        body: {
          username: 'newuser@example.com',
          password: '12345',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Password must be at least 12 characters');
    });

    it('should successfully create a new user', async () => {
      (requireAdmin as jest.Mock).mockResolvedValue({
        authenticated: true,
        userId: 'admin123',
        isAdmin: true,
      });

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');

      const mockCreatedUser = {
        _id: 'newuser123',
        username: 'newuser@example.com',
        email: 'newuser@example.com',
        isActive: true,
        isAdmin: false,
        mustChangePassword: true,
        createdAt: new Date('2024-01-01'),
        toObject: jest.fn().mockReturnValue({
          _id: 'newuser123',
          username: 'newuser@example.com',
          email: 'newuser@example.com',
          isActive: true,
          isAdmin: false,
          mustChangePassword: true,
          createdAt: new Date('2024-01-01'),
          passwordHash: 'hashedpassword',
        }),
      };

      (User.create as jest.Mock).mockResolvedValue(mockCreatedUser);

      const request = createNextRequest('http://localhost/api/auth/users', {
        method: 'POST',
        headers: { Authorization: 'Bearer admin-token' },
        body: {
          username: 'newuser@example.com',
          password: 'Password123!@#',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user).toBeDefined();
      expect(data.user.id).toBe('newuser123');
      expect(data.user.mustChangePassword).toBe(true);
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123!@#', 12);
    });
  });
});

