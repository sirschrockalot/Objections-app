/**
 * API client helper for making authenticated requests
 */

import { error as logError, warn as logWarn } from './logger';

function getApiUrl(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const refreshToken = localStorage.getItem('refresh-token');
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${getApiUrl()}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      // Refresh token is invalid, clear all tokens
      localStorage.removeItem('auth-token');
      localStorage.removeItem('refresh-token');
      return null;
    }

    const data = await response.json();
    
    // Store new tokens
    if (data.token) {
      localStorage.setItem('auth-token', data.token);
    }
    if (data.refreshToken) {
      localStorage.setItem('refresh-token', data.refreshToken);
    }

    return data.token;
  } catch (error) {
    logError('Token refresh failed', error);
    localStorage.removeItem('auth-token');
    localStorage.removeItem('refresh-token');
    return null;
  }
}

export function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('auth-token')
    : null;
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

async function makeAuthenticatedRequest(
  url: string,
  options: RequestInit
): Promise<Response> {
  let response = await fetch(url, options);

  // If 401, try to refresh token and retry once
  if (response.status === 401 && typeof window !== 'undefined') {
    const newToken = await refreshAccessToken();
    if (newToken) {
      // Retry with new token
      const headers = new Headers(options.headers);
      headers.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(url, {
        ...options,
        headers,
      });
    }
  }

  return response;
}

export async function apiGet(endpoint: string, params?: Record<string, string>): Promise<any> {
  if (typeof window === 'undefined') return null;

  try {
    const url = new URL(`${getApiUrl()}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await makeAuthenticatedRequest(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logError(`API GET failed: ${endpoint}`, error);
    throw error;
  }
}

export async function apiPost(endpoint: string, data: any): Promise<any> {
  if (typeof window === 'undefined') return null;

  try {
    const response = await makeAuthenticatedRequest(`${getApiUrl()}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logError(`API POST failed: ${endpoint}`, error);
    throw error;
  }
}

export async function apiPut(endpoint: string, data: any): Promise<any> {
  if (typeof window === 'undefined') return null;

  try {
    const response = await makeAuthenticatedRequest(`${getApiUrl()}${endpoint}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logError(`API PUT failed: ${endpoint}`, error);
    throw error;
  }
}

export async function apiDelete(endpoint: string, params?: Record<string, string>): Promise<any> {
  if (typeof window === 'undefined') return null;

  try {
    const url = new URL(`${getApiUrl()}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await makeAuthenticatedRequest(url.toString(), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logError(`API DELETE failed: ${endpoint}`, error);
    throw error;
  }
}

