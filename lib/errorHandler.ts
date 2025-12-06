/**
 * Error handling utility for secure error responses
 * Prevents information disclosure in production environments
 */

/**
 * Returns a safe error message for client responses
 * In production, returns generic messages to prevent information disclosure
 * In development, returns detailed error messages for debugging
 */
export function getSafeErrorMessage(error: any, defaultMessage: string = 'An error occurred'): string {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    // In development, return detailed error messages for debugging
    return error?.message || defaultMessage;
  }
  
  // In production, return generic error messages
  return defaultMessage;
}

/**
 * Logs detailed error information server-side only
 * Never exposes sensitive information to clients
 */
export function logError(context: string, error: any, metadata?: Record<string, any>): void {
  const errorDetails = {
    context,
    message: error?.message,
    stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    code: error?.code,
    ...metadata,
  };
  
  console.error(`[${context}] Error:`, errorDetails);
}

/**
 * Creates a safe error response for API routes
 * Logs detailed error server-side, returns generic message to client
 */
export function createSafeErrorResponse(
  context: string,
  error: any,
  defaultMessage: string = 'An error occurred. Please try again later.',
  statusCode: number = 500
): { response: any; logged: boolean } {
  // Log detailed error server-side
  logError(context, error);
  
  // Return safe error message to client
  const safeMessage = getSafeErrorMessage(error, defaultMessage);
  
  return {
    response: {
      error: safeMessage,
    },
    logged: true,
  };
}

