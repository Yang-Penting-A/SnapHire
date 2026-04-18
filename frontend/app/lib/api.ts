/**
 * API Utility Functions with Token Authentication
 * 
 * Provides fetch wrapper that automatically includes JWT token from localStorage
 */

export interface ApiOptions extends RequestInit {
  includeToken?: boolean;
}

/**
 * Fetch wrapper that automatically includes JWT token in Authorization header
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
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
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
 * Get stored JWT token from localStorage
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

/**
 * Get stored user data from localStorage
 */
export function getUserData() {
  if (typeof window === 'undefined') return null;
  const userData = localStorage.getItem('user');
  if (!userData) return null;
  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
}

/**
 * Clear stored authentication data
 */
export function clearAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
