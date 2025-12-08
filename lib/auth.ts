/**
 * Authentication utilities
 * MongoDB-backed authentication using API routes
 */

import { error as logError } from './logger';

export interface User {
  id: string;
  username: string;
  email?: string;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  isAdmin?: boolean;
  mustChangePassword?: boolean;
}

export interface UserCredentials {
  username: string;
  password: string;
}

const SESSION_STORAGE_KEY = 'response-ready-current-user';
const USER_ID_STORAGE_KEY = 'response-ready-current-user-id';

/**
 * Helper function to get API base URL
 */
function getApiUrl(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

/**
 * Helper function to get auth token from storage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth-token');
}

/**
 * Helper function to get refresh token from storage
 */
function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh-token');
}

/**
 * Helper function to get auth headers with JWT token
 */
function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Register a new user
 */
export async function registerUser(
  username: string,
  password: string,
  email?: string
): Promise<User> {
  if (typeof window === 'undefined') {
    throw new Error('Registration must be done in browser');
  }

  try {
    const response = await fetch(`${getApiUrl()}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password, email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    // Store tokens if provided
    if (typeof window !== 'undefined') {
      if (data.token) {
        localStorage.setItem('auth-token', data.token);
      }
      if (data.refreshToken) {
        localStorage.setItem('refresh-token', data.refreshToken);
      }
    }

    return data.user;
  } catch (error: any) {
    throw new Error(error.message || 'Registration failed');
  }
}

/**
 * Authenticate user
 */
export async function authenticateUser(
  username: string,
  password: string
): Promise<User | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const response = await fetch(`${getApiUrl()}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return null;
    }

    // Store tokens if provided
    if (typeof window !== 'undefined') {
      if (data.token) {
        localStorage.setItem('auth-token', data.token);
      }
      if (data.refreshToken) {
        localStorage.setItem('refresh-token', data.refreshToken);
      }
    }

    return data.user;
  } catch (error) {
    logError('Login failed', error);
    return null;
  }
}

/**
 * Get current user session (from client storage)
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;

  try {
    const sessionData = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionData) {
      return JSON.parse(sessionData) as User;
    }

    // Try to restore from localStorage user ID
    const userId = localStorage.getItem(USER_ID_STORAGE_KEY);
    if (userId) {
      // We'll need to fetch from API, but for now return null
      // The component should handle fetching if needed
      return null;
    }
  } catch (error) {
    logError('Failed to get current user', error);
  }

  return null;
}

/**
 * Fetch current user from API using JWT token
 */
export async function fetchCurrentUser(): Promise<User | null> {
  if (typeof window === 'undefined') return null;

  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(`${getApiUrl()}/api/auth/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      // If token is invalid, clear it
      if (response.status === 401) {
        clearCurrentUser();
      }
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    logError('Failed to fetch current user', error);
    return null;
  }
}

/**
 * Set current user session
 */
export function setCurrentUser(user: User): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(USER_ID_STORAGE_KEY, user.id);
  } catch (error) {
    logError('Failed to set current user', error);
  }
}

/**
 * Clear current user session
 */
export async function clearCurrentUser(): Promise<void> {
  if (typeof window === 'undefined') return;

  const currentUser = getCurrentUser();
  if (currentUser) {
    // Track logout activity
    try {
      await trackUserActivity(currentUser.id, 'logout', {});
    } catch (error) {
      logError('Failed to track logout', error);
    }
  }

  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  localStorage.removeItem(USER_ID_STORAGE_KEY);
  localStorage.removeItem('auth-token');
  localStorage.removeItem('refresh-token');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

/**
 * Get current user ID
 */
export function getCurrentUserId(): string | null {
  const user = getCurrentUser();
  return user?.id || null;
}

/**
 * Track user activity
 */
export async function trackUserActivity(
  userId: string,
  action: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const response = await fetch(`${getApiUrl()}/api/auth/activity`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action, metadata }),
    });

    if (!response.ok) {
      logError('Failed to track activity', undefined);
    }
  } catch (error) {
    logError('Failed to track user activity', error);
  }
}

/**
 * Get user activities
 */
export async function getUserActivities(userId?: string): Promise<Array<{
  userId: string;
  action: string;
  timestamp: string;
  metadata: Record<string, any>;
  userAgent: string;
  url: string;
}>> {
  if (typeof window === 'undefined') return [];

  try {
    const url = userId
      ? `${getApiUrl()}/api/auth/activities?userId=${userId}`
      : `${getApiUrl()}/api/auth/activities`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.activities || [];
  } catch (error) {
    logError('Failed to load user activities', error);
    return [];
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(userId: string): Promise<{
  totalLogins: number;
  lastLoginAt: string | null;
  totalSessions: number;
  actionsByType: Record<string, number>;
}> {
  try {
    const response = await fetch(`${getApiUrl()}/api/auth/stats?userId=${userId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      return {
        totalLogins: 0,
        lastLoginAt: null,
        totalSessions: 0,
        actionsByType: {},
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    logError('Failed to get user stats', error);
    return {
      totalLogins: 0,
      lastLoginAt: null,
      totalSessions: 0,
      actionsByType: {},
    };
  }
}

/**
 * Get all users (admin function)
 */
export async function getAllUsers(): Promise<User[]> {
  if (typeof window === 'undefined') return [];

  try {
    const response = await fetch(`${getApiUrl()}/api/auth/users`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.users || [];
  } catch (error) {
    logError('Failed to get users', error);
    return [];
  }
}

/**
 * Change user password
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('Password change must be done in browser');
  }

  try {
    const response = await fetch(`${getApiUrl()}/api/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to change password');
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to change password');
  }
}

/**
 * Update user email
 */
export async function updateUserEmail(userId: string, newEmail: string): Promise<User> {
  if (typeof window === 'undefined') {
    throw new Error('Email update must be done in browser');
  }

  try {
    const response = await fetch(`${getApiUrl()}/api/auth/email`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email: newEmail }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update email');
    }

    return data.user;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update email');
  }
}

/**
 * Create new user (admin only)
 */
export async function createUser(
  username: string,
  password: string,
  email?: string,
  isAdmin?: boolean
): Promise<User> {
  if (typeof window === 'undefined') {
    throw new Error('User creation must be done in browser');
  }

  try {
    const response = await fetch(`${getApiUrl()}/api/auth/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ username, password, email, isAdmin }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create user');
    }

    return data.user;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create user');
  }
}

/**
 * Update user (admin only)
 */
export async function updateUser(
  userId: string,
  updates: {
    username?: string;
    email?: string;
    password?: string;
    isActive?: boolean;
    isAdmin?: boolean;
  }
): Promise<User> {
  if (typeof window === 'undefined') {
    throw new Error('User update must be done in browser');
  }

  try {
    const response = await fetch(`${getApiUrl()}/api/auth/users/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update user');
    }

    return data.user;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update user');
  }
}

/**
 * Delete user (admin only)
 */
export async function deleteUser(userId: string): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('User deletion must be done in browser');
  }

  try {
    const response = await fetch(`${getApiUrl()}/api/auth/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete user');
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to delete user');
  }
}
