/**
 * Tests for authentication utilities
 */

import {
  registerUser,
  authenticateUser,
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  isAuthenticated,
  getCurrentUserId,
  fetchCurrentUser,
} from '@/lib/auth';

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage and sessionStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

const sessionStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

describe('Authentication Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    sessionStorageMock.clear();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user123',
        username: 'test@example.com',
        email: 'test@example.com',
        createdAt: '2024-01-01T00:00:00.000Z',
        isActive: true,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ 
          user: mockUser,
          token: 'mock-token',
          refreshToken: 'mock-refresh-token',
        }),
      });

    const result = await registerUser('test@example.com', 'password123');

    expect(result).toEqual(mockUser);
    expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/register'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'test@example.com',
            password: 'password123',
            email: undefined,
          }),
        })
      );
    // Check that tokens were stored
    expect(localStorageMock.setItem).toHaveBeenCalledWith('auth-token', 'mock-token');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('refresh-token', 'mock-refresh-token');
    });

    it('should throw error on registration failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Email already exists' }),
      });

      await expect(
        registerUser('existing@example.com', 'password123')
      ).rejects.toThrow('Email already exists');
    });

    it('should throw error in non-browser environment', async () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      await expect(
        registerUser('test@example.com', 'password123')
      ).rejects.toThrow('Registration must be done in browser');

      global.window = originalWindow;
    });
  });

  describe('authenticateUser', () => {
    it('should authenticate user successfully', async () => {
      const mockUser = {
        id: 'user123',
        username: 'test@example.com',
        email: 'test@example.com',
        createdAt: '2024-01-01T00:00:00.000Z',
        isActive: true,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ 
          user: mockUser,
          token: 'mock-token',
          refreshToken: 'mock-refresh-token',
        }),
      });

      const result = await authenticateUser('test@example.com', 'password123');

    expect(result).toEqual(mockUser);
    expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    // Check that tokens were stored
    expect(localStorageMock.setItem).toHaveBeenCalledWith('auth-token', 'mock-token');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('refresh-token', 'mock-refresh-token');
    });

    it('should return null on authentication failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' }),
      });

      const result = await authenticateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should return null in non-browser environment', async () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const result = await authenticateUser('test@example.com', 'password123');

      expect(result).toBeNull();

      global.window = originalWindow;
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user from sessionStorage', () => {
      const mockUser = {
        id: 'user123',
        username: 'test@example.com',
        email: 'test@example.com',
        createdAt: '2024-01-01T00:00:00.000Z',
        isActive: true,
      };

      sessionStorageMock.setItem('response-ready-current-user', JSON.stringify(mockUser));

      const result = getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    it('should return null if no user in sessionStorage', () => {
      const result = getCurrentUser();
      expect(result).toBeNull();
    });

    it('should return null in non-browser environment', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const result = getCurrentUser();
      expect(result).toBeNull();

      global.window = originalWindow;
    });
  });

  describe('setCurrentUser', () => {
    it('should store user in sessionStorage and localStorage', () => {
      const mockUser = {
        id: 'user123',
        username: 'test@example.com',
        email: 'test@example.com',
        createdAt: '2024-01-01T00:00:00.000Z',
        isActive: true,
      };

      setCurrentUser(mockUser);

      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'response-ready-current-user',
        JSON.stringify(mockUser)
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'response-ready-current-user-id',
        'user123'
      );
    });
  });

  describe('clearCurrentUser', () => {
    it('should remove user from sessionStorage and localStorage', async () => {
      await clearCurrentUser();

      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('response-ready-current-user');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('response-ready-current-user-id');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth-token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh-token');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true if user exists in sessionStorage', () => {
      const mockUser = {
        id: 'user123',
        username: 'test@example.com',
        email: 'test@example.com',
        createdAt: '2024-01-01T00:00:00.000Z',
        isActive: true,
      };

      sessionStorageMock.setItem('response-ready-current-user', JSON.stringify(mockUser));

      const result = isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false if no user in sessionStorage', () => {
      const result = isAuthenticated();
      expect(result).toBe(false);
    });
  });

  describe('getCurrentUserId', () => {
    it('should return user ID from sessionStorage', () => {
      const mockUser = {
        id: 'user123',
        username: 'test@example.com',
        email: 'test@example.com',
        createdAt: '2024-01-01T00:00:00.000Z',
        isActive: true,
      };

      sessionStorageMock.setItem('response-ready-current-user', JSON.stringify(mockUser));

      const result = getCurrentUserId();

      expect(result).toBe('user123');
    });

    it('should return null if no user ID in localStorage', () => {
      const result = getCurrentUserId();
      expect(result).toBeNull();
    });
  });

  describe('fetchCurrentUser', () => {
    it('should fetch user using JWT token', async () => {
      localStorageMock.setItem('auth-token', 'test-token');
      
      const mockUser = {
        id: 'user123',
        username: 'test@example.com',
        email: 'test@example.com',
        isAdmin: false,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ user: mockUser }),
      });

      const result = await fetchCurrentUser();

      expect(result).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/me'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );
    });

    it('should clear token on 401 response', async () => {
      localStorageMock.setItem('auth-token', 'invalid-token');
      localStorageMock.setItem('refresh-token', 'invalid-refresh-token');

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ error: 'Unauthorized' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ error: 'Unauthorized' }),
        });

      const result = await fetchCurrentUser();

      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth-token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh-token');
    });
  });
});

