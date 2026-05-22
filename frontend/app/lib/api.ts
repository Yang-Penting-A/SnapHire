/**
 * API Utility Functions with Token Authentication
 * 
 * Provides fetch wrapper that automatically includes JWT token from localStorage
 * with session expiration validation
 */

import sessionManager from './sessionManager';
import { supabase } from './supabase';

const API_PREFIX = '/api';

export function getApiBaseUrl() {
  const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!rawBaseUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is required');
  }

  return rawBaseUrl.replace(/\/+$/, '').replace(/\/api$/, '') + API_PREFIX;
}

export function buildApiUrl(url: string) {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  const pathWithoutApiPrefix = normalizedPath.replace(/^\/api(?=\/|$)/, '');

  return `${getApiBaseUrl()}${pathWithoutApiPrefix}`;
}

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
    let token: string | null = null;

    // Prefer token managed by sessionManager when valid
    const validation = sessionManager.validateSession();
    if (validation.isValid) {
      token = sessionManager.getToken();
    } else {
      console.warn('[API] ⚠️ SessionManager invalid, trying Supabase session fallback:', validation.reason);
    }

    // Fallback: read token directly from Supabase client session
    if (!token) {
      const { data: supaSession, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.warn('[API] ⚠️ Supabase getSession fallback failed:', sessionError.message);
      }
      token = supaSession?.session?.access_token ?? null;
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('[API] ⚠️ No valid token found from sessionManager or Supabase session');
      sessionManager.clearSession();
      throw new Error('No valid auth token. Please login again.');
    }
  }

  const fullUrl = buildApiUrl(url);

  // Debug logging: final URL and request details
  if (typeof window !== 'undefined') {
    // Use console.debug to avoid noisy logs in production, but useful in dev
    console.debug('[apiFetch] Final URL:', fullUrl);
    console.debug('[apiFetch] Method:', fetchOptions.method || 'GET');
    console.debug('[apiFetch] Headers:', headers);
    if (fetchOptions.body) console.debug('[apiFetch] Body:', fetchOptions.body);
  }

  try {
    const response = await fetch(fullUrl, {
      ...fetchOptions,
      headers,
    });
    return response;
  } catch (networkError: any) {
    console.error('[apiFetch] Network error when fetching', fullUrl, networkError && (networkError.message || networkError));
    throw networkError;
  }
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
