/**
 * Shared test utilities and mock helpers
 * Use these to ensure consistent mocking across all tests
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Create a mock rate limit middleware
 */
export function createMockRateLimitMiddleware(allowed: boolean = true, remaining: number = 99) {
  return jest.fn().mockResolvedValue({
    allowed,
    remaining,
    response: allowed ? undefined : NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    ),
  });
}

/**
 * Create a mock requireAuth result
 */
export function createMockAuthResult(authenticated: boolean = true, userId: string = 'user123', isAdmin: boolean = false) {
  if (!authenticated) {
    return {
      authenticated: false,
      error: 'Authentication required',
      statusCode: 401,
    };
  }
  return {
    authenticated: true,
    userId,
    isAdmin,
  };
}

/**
 * Create a mock requireAdmin result
 */
export function createMockAdminResult(authenticated: boolean = true, userId: string = 'admin123') {
  if (!authenticated) {
    return {
      authenticated: false,
      error: 'Admin access required',
      statusCode: 403,
    };
  }
  return {
    authenticated: true,
    userId,
    isAdmin: true,
  };
}

/**
 * Create a NextRequest for testing
 */
export function createTestRequest(
  url: string,
  options: { method?: string; body?: any; headers?: Record<string, string> } = {}
): NextRequest {
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

/**
 * Extract response body from a Response object
 * Handles both json() and text() methods
 */
export async function getResponseBody(response: Response): Promise<any> {
  try {
    if (typeof (response as any).json === 'function') {
      const data = await (response as any).json();
      return data;
    }
  } catch (e) {
    // If json() fails, try text()
  }
  
  try {
    const text = await response.text();
    if (text) {
      try {
        return JSON.parse(text);
      } catch (e) {
        return text;
      }
    }
  } catch (e) {
    // If text() also fails, return empty object
  }
  
  return {};
}

