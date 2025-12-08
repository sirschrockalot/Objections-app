/**
 * Centralized logging utility with log levels
 * Reduces Heroku log costs by filtering logs based on environment
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

// Get log level from environment variable (default: ERROR in production, DEBUG in development)
function getLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toUpperCase();
  
  if (envLevel === 'DEBUG') return LogLevel.DEBUG;
  if (envLevel === 'INFO') return LogLevel.INFO;
  if (envLevel === 'WARN') return LogLevel.WARN;
  if (envLevel === 'ERROR') return LogLevel.ERROR;
  if (envLevel === 'NONE') return LogLevel.NONE;
  
  // Default: ERROR in production, DEBUG in development
  return process.env.NODE_ENV === 'production' ? LogLevel.ERROR : LogLevel.DEBUG;
}

const currentLogLevel = getLogLevel();

/**
 * Log debug messages (only in development)
 */
export function debug(message: string, ...args: any[]): void {
  if (currentLogLevel <= LogLevel.DEBUG) {
    console.debug(`[DEBUG] ${message}`, ...args);
  }
}

/**
 * Log info messages (disabled in production by default)
 */
export function info(message: string, ...args: any[]): void {
  if (currentLogLevel <= LogLevel.INFO) {
    console.info(`[INFO] ${message}`, ...args);
  }
}

/**
 * Log warnings (enabled in production)
 */
export function warn(message: string, ...args: any[]): void {
  if (currentLogLevel <= LogLevel.WARN) {
    console.warn(`[WARN] ${message}`, ...args);
  }
}

/**
 * Log errors (always enabled)
 */
export function error(message: string, error?: any, metadata?: Record<string, any>): void {
  if (currentLogLevel <= LogLevel.ERROR) {
    const errorDetails: any = {
      message,
      ...metadata,
    };
    
    if (error) {
      errorDetails.error = {
        message: error?.message,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
        code: error?.code,
        name: error?.name,
      };
    }
    
    console.error(`[ERROR] ${message}`, errorDetails);
  }
}

/**
 * Log with context (for structured logging)
 */
export function log(context: string, level: LogLevel, message: string, data?: any): void {
  if (currentLogLevel <= level) {
    const logData = {
      context,
      message,
      timestamp: new Date().toISOString(),
      ...(data && { data }),
    };
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(`[${context}]`, logData);
        break;
      case LogLevel.INFO:
        console.info(`[${context}]`, logData);
        break;
      case LogLevel.WARN:
        console.warn(`[${context}]`, logData);
        break;
      case LogLevel.ERROR:
        console.error(`[${context}]`, logData);
        break;
    }
  }
}

/**
 * Get current log level (for testing/debugging)
 */
export function getCurrentLogLevel(): LogLevel {
  return currentLogLevel;
}

