/**
 * API client helper for making authenticated requests
 */

function getApiUrl(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const userId = typeof window !== 'undefined' 
    ? localStorage.getItem('response-ready-current-user-id')
    : null;
  
  if (userId) {
    headers['x-user-id'] = userId;
  }
  
  return headers;
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

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API GET error (${endpoint}):`, error);
    throw error;
  }
}

export async function apiPost(endpoint: string, data: any): Promise<any> {
  if (typeof window === 'undefined') return null;

  try {
    const response = await fetch(`${getApiUrl()}${endpoint}`, {
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
    console.error(`API POST error (${endpoint}):`, error);
    throw error;
  }
}

export async function apiPut(endpoint: string, data: any): Promise<any> {
  if (typeof window === 'undefined') return null;

  try {
    const response = await fetch(`${getApiUrl()}${endpoint}`, {
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
    console.error(`API PUT error (${endpoint}):`, error);
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

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API DELETE error (${endpoint}):`, error);
    throw error;
  }
}

