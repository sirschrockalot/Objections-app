/**
 * Session timeout and idle detection utilities
 * Provides automatic logout after inactivity and maximum session duration
 */

export interface SessionTimeoutConfig {
  idleTimeoutMinutes: number; // Time before logout due to inactivity (default: 30)
  maxSessionHours: number; // Maximum session duration (default: 8 hours)
  warningBeforeTimeoutMinutes: number; // Show warning X minutes before timeout (default: 5)
}

const DEFAULT_CONFIG: SessionTimeoutConfig = {
  idleTimeoutMinutes: 30, // 30 minutes of inactivity
  maxSessionHours: 8, // 8 hour maximum session
  warningBeforeTimeoutMinutes: 5, // Warn 5 minutes before timeout
};

// Activity tracking
let lastActivityTime: number = Date.now();
let sessionStartTime: number = Date.now();
let activityCheckInterval: NodeJS.Timeout | null = null;
let warningShown: boolean = false;

// Event listeners
const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

/**
 * Track user activity
 */
function trackActivity(): void {
  lastActivityTime = Date.now();
  warningShown = false; // Reset warning when activity detected
}

/**
 * Initialize activity tracking
 * Returns cleanup function
 */
export function initializeActivityTracking(): () => void {
  if (typeof window === 'undefined') return () => {};

  // Set initial times
  lastActivityTime = Date.now();
  sessionStartTime = Date.now();

  // Add event listeners for user activity
  activityEvents.forEach((event) => {
    window.addEventListener(event, trackActivity, { passive: true });
  });

  // Return cleanup function
  return () => {
    activityEvents.forEach((event) => {
      window.removeEventListener(event, trackActivity);
    });
  };
}

/**
 * Stop activity tracking
 */
export function stopActivityTracking(): void {
  if (typeof window === 'undefined') return;

  activityEvents.forEach((event) => {
    window.removeEventListener(event, trackActivity);
  });

  if (activityCheckInterval) {
    clearInterval(activityCheckInterval);
    activityCheckInterval = null;
  }
}

/**
 * Get time since last activity (in milliseconds)
 */
export function getTimeSinceLastActivity(): number {
  return Date.now() - lastActivityTime;
}

/**
 * Get session duration (in milliseconds)
 */
export function getSessionDuration(): number {
  return Date.now() - sessionStartTime;
}

/**
 * Check if user is idle (exceeded idle timeout)
 */
export function isIdle(config: SessionTimeoutConfig = DEFAULT_CONFIG): boolean {
  const idleTime = getTimeSinceLastActivity();
  const idleTimeoutMs = config.idleTimeoutMinutes * 60 * 1000;
  return idleTime > idleTimeoutMs;
}

/**
 * Check if session has exceeded maximum duration
 */
export function isSessionExpired(config: SessionTimeoutConfig = DEFAULT_CONFIG): boolean {
  const sessionDuration = getSessionDuration();
  const maxSessionMs = config.maxSessionHours * 60 * 60 * 1000;
  return sessionDuration > maxSessionMs;
}

/**
 * Check if warning should be shown (approaching timeout)
 */
export function shouldShowWarning(config: SessionTimeoutConfig = DEFAULT_CONFIG): {
  show: boolean;
  reason: 'idle' | 'session' | null;
  minutesRemaining: number;
} {
  const idleTime = getTimeSinceLastActivity();
  const sessionDuration = getSessionDuration();
  const idleTimeoutMs = config.idleTimeoutMinutes * 60 * 1000;
  const maxSessionMs = config.maxSessionHours * 60 * 60 * 1000;
  const warningMs = config.warningBeforeTimeoutMinutes * 60 * 1000;

  // Check idle timeout warning
  const timeUntilIdleTimeout = idleTimeoutMs - idleTime;
  if (timeUntilIdleTimeout > 0 && timeUntilIdleTimeout <= warningMs && !warningShown) {
    return {
      show: true,
      reason: 'idle',
      minutesRemaining: Math.ceil(timeUntilIdleTimeout / (60 * 1000)),
    };
  }

  // Check session timeout warning
  const timeUntilSessionTimeout = maxSessionMs - sessionDuration;
  if (timeUntilSessionTimeout > 0 && timeUntilSessionTimeout <= warningMs && !warningShown) {
    return {
      show: true,
      reason: 'session',
      minutesRemaining: Math.ceil(timeUntilSessionTimeout / (60 * 1000)),
    };
  }

  return { show: false, reason: null, minutesRemaining: 0 };
}

/**
 * Mark warning as shown
 */
export function markWarningShown(): void {
  warningShown = true;
}

/**
 * Reset session (call after login)
 */
export function resetSession(): void {
  lastActivityTime = Date.now();
  sessionStartTime = Date.now();
  warningShown = false;
}

/**
 * Get configuration from environment or use defaults
 */
export function getSessionTimeoutConfig(): SessionTimeoutConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;

  // Allow configuration via environment variables or localStorage
  const config: SessionTimeoutConfig = { ...DEFAULT_CONFIG };

  // Check for environment variables (for admin users, could be different)
  const envIdleTimeout = process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES;
  const envMaxSession = process.env.NEXT_PUBLIC_MAX_SESSION_HOURS;
  const envWarning = process.env.NEXT_PUBLIC_WARNING_BEFORE_TIMEOUT_MINUTES;

  if (envIdleTimeout) {
    config.idleTimeoutMinutes = parseInt(envIdleTimeout, 10);
  }
  if (envMaxSession) {
    config.maxSessionHours = parseInt(envMaxSession, 10);
  }
  if (envWarning) {
    config.warningBeforeTimeoutMinutes = parseInt(envWarning, 10);
  }

  return config;
}

