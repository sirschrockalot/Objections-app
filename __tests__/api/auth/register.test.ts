/**
 * Tests for /api/auth/register route
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
}));
const mockRateLimitResult = {
  allowed: true,
  remaining: 4,
};

jest.mock('@/lib/rateLimiter', () => ({
  createRateLimitMiddleware: jest.fn(() => jest.fn().mockResolvedValue(mockRateLimitResult)),
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
}));
jest.mock('@/lib/errorHandler', () => ({
  getSafeErrorMessage: jest.fn((error) => error?.message || 'An error occurred'),
  logError: jest.fn(),
}));

// Now import after mocks
import { POST } from '@/app/api/auth/register/route';
import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { signToken, signRefreshToken } from '@/lib/jwt';
import { createRateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter';
import { validatePassword } from '@/lib/passwordValidation';
import { sanitizeEmail } from '@/lib/inputValidation';

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createRateLimitMiddleware as jest.Mock).mockReturnValue(
      jest.fn().mockResolvedValue(mockRateLimitResult)
    );
    (signToken as jest.Mock).mockReturnValue('mock-jwt-token');
    (signRefreshToken as jest.Mock).mockReturnValue('mock-refresh-token');
    (sanitizeEmail as jest.Mock).mockImplementation((email) => email || null);
    (validatePassword as jest.Mock).mockReturnValue({ valid: true, error: null });
  });

  it('should return 400 if username is not a valid email', async () => {
    (sanitizeEmail as jest.Mock).mockReturnValue(null);

    const request = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: 'notanemail',
        password: 'Password123!@#',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Username must be a valid email address');
  });

  it('should return 400 if password is too short', async () => {
    (sanitizeEmail as jest.Mock).mockReturnValue('test@example.com');
    (validatePassword as jest.Mock).mockReturnValue({
      valid: false,
      error: 'Password must be at least 12 characters long',
    });

    const request = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: 'test@example.com',
        password: '12345', // Less than 12 characters
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Password must be at least 12 characters long');
  });

  it('should return 400 if user already exists', async () => {
    const mockExistingUser = {
      _id: 'existing123',
      username: 'existing@example.com',
    };

    (User.findOne as jest.Mock).mockResolvedValue(mockExistingUser);
    (sanitizeEmail as jest.Mock).mockReturnValue('existing@example.com');

    const request = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: 'existing@example.com',
        password: 'Password123!@#',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('An account with this email already exists');
  });

  it('should successfully register a new user', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
    (sanitizeEmail as jest.Mock).mockReturnValue('newuser@example.com');

    const mockCreatedUser = {
      _id: 'newuser123',
      username: 'newuser@example.com',
      email: 'newuser@example.com',
      createdAt: new Date('2024-01-01'),
      isActive: true,
      toObject: jest.fn().mockReturnValue({
        _id: 'newuser123',
        username: 'newuser@example.com',
        email: 'newuser@example.com',
        createdAt: new Date('2024-01-01'),
        isActive: true,
        passwordHash: 'hashedpassword',
      }),
    };

    (User.create as jest.Mock).mockResolvedValue(mockCreatedUser);

    const request = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: 'newuser@example.com',
        password: 'Password123!@#',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.user).toBeDefined();
    expect(data.user.id).toBe('newuser123');
    expect(data.user.username).toBe('newuser@example.com');
    expect(data.user.passwordHash).toBeUndefined();
    expect(data.token).toBe('mock-jwt-token');
    expect(data.refreshToken).toBe('mock-refresh-token');
    expect(signToken).toHaveBeenCalledWith({
      userId: 'newuser123',
      isAdmin: false,
      email: 'newuser@example.com',
    });
    expect(signRefreshToken).toHaveBeenCalledWith({
      userId: 'newuser123',
      isAdmin: false,
      email: 'newuser@example.com',
    });
    expect(bcrypt.hash).toHaveBeenCalledWith('Password123!@#', 12);
    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'newuser@example.com',
        email: 'newuser@example.com',
        isActive: true,
      })
    );
  });

  it('should handle optional email parameter', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');

    const mockCreatedUser = {
      _id: 'newuser123',
      username: 'newuser@example.com',
      email: 'newuser@example.com',
      createdAt: new Date('2024-01-01'),
      isActive: true,
      toObject: jest.fn().mockReturnValue({
        _id: 'newuser123',
        username: 'newuser@example.com',
        email: 'newuser@example.com',
        createdAt: new Date('2024-01-01'),
        isActive: true,
        passwordHash: 'hashedpassword',
      }),
    };

    (User.create as jest.Mock).mockResolvedValue(mockCreatedUser);

    const request = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: 'newuser@example.com',
        password: 'Password123!@#',
        email: 'custom@example.com',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'custom@example.com',
      })
    );
  });

  it('should handle server errors gracefully', async () => {
    (User.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: 'test@example.com',
        password: 'Password123!@#',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Database error');
  });
});

