/**
 * Session Manager - Handles auth session expiration, inactivity timeout, and storage
 */

// Configuration (can be overridden via environment variables)
const SESSION_CONFIG = {
  // Max session duration: 4 hours (14400 seconds) - RECOMMENDED FOR HR/ADMIN
  MAX_SESSION_DURATION: parseInt(process.env.NEXT_PUBLIC_MAX_SESSION_DURATION || '14400', 10),
  
  // Inactivity timeout: 15 minutes (900 seconds)
  INACTIVITY_TIMEOUT: parseInt(process.env.NEXT_PUBLIC_INACTIVITY_TIMEOUT || '900', 10),
  
  // Storage keys
  TOKEN_KEY: 'token',
  USER_KEY: 'user',
  SESSION_TIMESTAMP_KEY: 'session_timestamp',
  LAST_ACTIVITY_KEY: 'last_activity_timestamp',
};

interface SessionData {
  token: string;
  user: Record<string, any>;
  sessionTimestamp: number;
  lastActivityTimestamp: number;
}

interface SessionValidation {
  isValid: boolean;
  reason?: string;
  expiresIn?: number; // seconds until expiration
}

/**
 * Store auth session with timestamp
 * Should be called after successful login
 */
export function storeSession(token: string, userData: Record<string, any>): void {
  if (typeof window === 'undefined') return;
  
  const now = Date.now();
  
  // Store token and user
  localStorage.setItem(SESSION_CONFIG.TOKEN_KEY, token);
  localStorage.setItem(SESSION_CONFIG.USER_KEY, JSON.stringify(userData));
  
  // Store session creation timestamp
  localStorage.setItem(SESSION_CONFIG.SESSION_TIMESTAMP_KEY, now.toString());
  
  // Initialize last activity timestamp
  localStorage.setItem(SESSION_CONFIG.LAST_ACTIVITY_KEY, now.toString());
  
  console.log('[SESSION] ✅ Session stored with expiration:', new Date(now + SESSION_CONFIG.MAX_SESSION_DURATION * 1000).toLocaleString());
}

/**
 * Update last activity timestamp (should be called on user interaction)
 */
export function recordActivity(): void {
  if (typeof window === 'undefined') return;
  
  const isSessionValid = validateSession().isValid;
  if (!isSessionValid) {
    console.log('[SESSION] ⚠️  Cannot record activity - session already expired');
    return;
  }
  
  const now = Date.now();
  localStorage.setItem(SESSION_CONFIG.LAST_ACTIVITY_KEY, now.toString());
  console.log('[SESSION] 👤 Activity recorded');
}

/**
 * Get remaining session time in seconds
 */
export function getSessionTimeRemaining(): number | null {
  if (typeof window === 'undefined') return null;
  
  const sessionTimestamp = localStorage.getItem(SESSION_CONFIG.SESSION_TIMESTAMP_KEY);
  if (!sessionTimestamp) return null;
  
  const sessionStart = parseInt(sessionTimestamp, 10);
  const now = Date.now();
  const elapsedSeconds = (now - sessionStart) / 1000;
  const remainingSeconds = SESSION_CONFIG.MAX_SESSION_DURATION - elapsedSeconds;
  
  return Math.max(0, Math.floor(remainingSeconds));
}

/**
 * Get remaining inactivity time in seconds
 */
export function getInactivityTimeRemaining(): number | null {
  if (typeof window === 'undefined') return null;
  
  const lastActivity = localStorage.getItem(SESSION_CONFIG.LAST_ACTIVITY_KEY);
  if (!lastActivity) return null;
  
  const lastActivityTime = parseInt(lastActivity, 10);
  const now = Date.now();
  const inactiveSeconds = (now - lastActivityTime) / 1000;
  const remainingSeconds = SESSION_CONFIG.INACTIVITY_TIMEOUT - inactiveSeconds;
  
  return Math.max(0, Math.floor(remainingSeconds));
}

/**
 * Comprehensive session validation
 * Checks: expiration, inactivity, token existence
 */
export function validateSession(): SessionValidation {
  if (typeof window === 'undefined') {
    return { isValid: false, reason: 'Server-side environment' };
  }
  
  const token = localStorage.getItem(SESSION_CONFIG.TOKEN_KEY);
  const user = localStorage.getItem(SESSION_CONFIG.USER_KEY);
  const sessionTimestamp = localStorage.getItem(SESSION_CONFIG.SESSION_TIMESTAMP_KEY);
  const lastActivityTimestamp = localStorage.getItem(SESSION_CONFIG.LAST_ACTIVITY_KEY);
  
  // Check if session data exists
  if (!token || !user || !sessionTimestamp || !lastActivityTimestamp) {
    return { 
      isValid: false, 
      reason: 'Session data missing' 
    };
  }
  
  const now = Date.now();
  const sessionStart = parseInt(sessionTimestamp, 10);
  const lastActivity = parseInt(lastActivityTimestamp, 10);
  
  // Check max session duration
  const sessionAgeSeconds = (now - sessionStart) / 1000;
  if (sessionAgeSeconds > SESSION_CONFIG.MAX_SESSION_DURATION) {
    return {
      isValid: false,
      reason: `Session expired (${Math.floor(sessionAgeSeconds)} seconds old, max: ${SESSION_CONFIG.MAX_SESSION_DURATION})`
    };
  }
  
  // Check inactivity timeout
  const inactiveSeconds = (now - lastActivity) / 1000;
  if (inactiveSeconds > SESSION_CONFIG.INACTIVITY_TIMEOUT) {
    return {
      isValid: false,
      reason: `Inactivity timeout (inactive for ${Math.floor(inactiveSeconds)} seconds, max: ${SESSION_CONFIG.INACTIVITY_TIMEOUT})`
    };
  }
  
  const expiresIn = Math.min(
    SESSION_CONFIG.MAX_SESSION_DURATION - sessionAgeSeconds,
    SESSION_CONFIG.INACTIVITY_TIMEOUT - inactiveSeconds
  );
  
  return {
    isValid: true,
    expiresIn: Math.floor(expiresIn)
  };
}

/**
 * Get current stored session (if valid)
 */
export function getSession(): SessionData | null {
  if (typeof window === 'undefined') return null;
  
  const validation = validateSession();
  if (!validation.isValid) {
    console.warn('[SESSION] ❌ Session invalid:', validation.reason);
    clearSession();
    return null;
  }
  
  const token = localStorage.getItem(SESSION_CONFIG.TOKEN_KEY);
  const userStr = localStorage.getItem(SESSION_CONFIG.USER_KEY);
  const sessionTimestamp = localStorage.getItem(SESSION_CONFIG.SESSION_TIMESTAMP_KEY);
  const lastActivityTimestamp = localStorage.getItem(SESSION_CONFIG.LAST_ACTIVITY_KEY);
  
  if (!token || !userStr || !sessionTimestamp || !lastActivityTimestamp) {
    return null;
  }
  
  return {
    token,
    user: JSON.parse(userStr),
    sessionTimestamp: parseInt(sessionTimestamp, 10),
    lastActivityTimestamp: parseInt(lastActivityTimestamp, 10)
  };
}

/**
 * Get stored user data if session is valid
 */
export function getUserData(): Record<string, any> | null {
  if (typeof window === 'undefined') return null;
  
  const session = getSession();
  return session?.user ?? null;
}

/**
 * Get stored token if session is valid
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  const session = getSession();
  return session?.token ?? null;
}

/**
 * Clear all session data
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(SESSION_CONFIG.TOKEN_KEY);
  localStorage.removeItem(SESSION_CONFIG.USER_KEY);
  localStorage.removeItem(SESSION_CONFIG.SESSION_TIMESTAMP_KEY);
  localStorage.removeItem(SESSION_CONFIG.LAST_ACTIVITY_KEY);
  
  console.log('[SESSION] 🗑️  Session cleared');
}

/**
 * Check if session is expiring soon (within threshold)
 * Useful for showing expiration warnings
 */
export function isSessionExpiringSoon(thresholdSeconds: number = 300): boolean {
  const remaining = getSessionTimeRemaining();
  if (remaining === null) return false;
  return remaining < thresholdSeconds;
}

/**
 * Format remaining time for display (e.g., "5m 30s")
 */
export function formatTimeRemaining(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return 'Expired';
  
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * Get session info for debugging
 */
export function getSessionInfo() {
  if (typeof window === 'undefined') return null;
  
  const validation = validateSession();
  const sessionTime = getSessionTimeRemaining();
  const inactivityTime = getInactivityTimeRemaining();
  
  return {
    isValid: validation.isValid,
    validationReason: validation.reason,
    sessionTimeRemaining: sessionTime,
    inactivityTimeRemaining: inactivityTime,
    maxSessionDuration: SESSION_CONFIG.MAX_SESSION_DURATION,
    inactivityTimeout: SESSION_CONFIG.INACTIVITY_TIMEOUT,
    config: SESSION_CONFIG
  };
}

export default {
  storeSession,
  recordActivity,
  validateSession,
  getSession,
  getUserData,
  getToken,
  clearSession,
  getSessionTimeRemaining,
  getInactivityTimeRemaining,
  isSessionExpiringSoon,
  formatTimeRemaining,
  getSessionInfo,
  config: SESSION_CONFIG
};
