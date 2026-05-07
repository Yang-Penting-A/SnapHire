/**
 * API Utility Functions with Token Authentication
 * 
 * Provides fetch wrapper that automatically includes JWT token from localStorage
 * with session expiration validation
 */

import sessionManager from './sessionManager';

export interface ApiOptions extends RequestInit {
  includeToken?: boolean;
}

/**
 * Fetch wrapper that automatically includes JWT token in Authorization header
 * 
 * Validates session expiration before making the request.
 * If session is expired, logs out the user automatically.
 * 
 * @param url - The API endpoint path (without base URL)
 * @param options - Fetch options
 * @returns Fetch response
 * 
 * @example
 * const response = await apiFetch('/login', {
 *   method: 'POST',
 *   body: JSON.stringify({ email: 'user@example.com' })
 * });
 */
export async function apiFetch(
  url: string,
  options: ApiOptions = {}
) {
  const { includeToken = true, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  // Include JWT token if available and not explicitly disabled
  if (includeToken && typeof window !== 'undefined') {
    // Validate session before using token
    const validation = sessionManager.validateSession();
    if (!validation.isValid) {
      console.warn('[API] ⚠️ Session expired or invalid:', validation.reason);
      sessionManager.clearSession();
      throw new Error('Session expired. Please login again.');
    }
    
    // Use sessionManager to get valid token
    const token = sessionManager.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('[API] ⚠️ No valid token found');
      sessionManager.clearSession();
      throw new Error('No valid session. Please login again.');
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  const response = await fetch(fullUrl, {
    ...fetchOptions,
    headers,
  });

  return response;
}

/**
 * Wrapper for apiFetch that automatically parses JSON response
 * 
 * @example
 * const data = await apiRequest('/jobs', { method: 'GET' });
 */
export async function apiRequest<T = any>(
  url: string,
  options: ApiOptions = {}
): Promise<T> {
  const response = await apiFetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Get stored JWT token from localStorage if session is valid
 * Returns null if session is expired
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Validate session before returning token
  const validation = sessionManager.validateSession();
  if (!validation.isValid) {
    console.warn('[API] Session expired, clearing token');
    sessionManager.clearSession();
    return null;
  }
  
  return sessionManager.getToken();
}

/**
 * Get stored user data from localStorage if session is valid
 * Returns null if session is expired
 */
export function getUserData() {
  if (typeof window === 'undefined') return null;
  
  // Validate session before returning user data
  const validation = sessionManager.validateSession();
  if (!validation.isValid) {
    console.warn('[API] Session expired, clearing user data');
    sessionManager.clearSession();
    return null;
  }
  
  return sessionManager.getUserData();
}

/**
 * Clear stored authentication data
 */
export function clearAuth() {
  if (typeof window === 'undefined') return;
  sessionManager.clearSession();
}
