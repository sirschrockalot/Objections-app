/**
 * Request deduplication utility
 * Prevents duplicate API calls when multiple identical requests are made simultaneously
 */

const pendingRequests = new Map<string, Promise<any>>();

/**
 * Deduplicate a request - if the same request is already in progress, return the existing promise
 * @param key - Unique key for the request (e.g., `analyze:${address}`)
 * @param requestFn - Function that performs the actual request
 * @returns Promise that resolves to the request result
 */
export function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  // If request is already pending, return the existing promise
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }

  // Create new promise and store it
  const promise = requestFn()
    .then((result) => {
      // Remove from pending requests on success
      pendingRequests.delete(key);
      return result;
    })
    .catch((error) => {
      // Remove from pending requests on error
      pendingRequests.delete(key);
      throw error;
    });

  pendingRequests.set(key, promise);
  return promise;
}

/**
 * Clear a specific pending request (useful for cancellation)
 */
export function clearPendingRequest(key: string): void {
  pendingRequests.delete(key);
}

/**
 * Clear all pending requests
 */
export function clearAllPendingRequests(): void {
  pendingRequests.clear();
}

/**
 * Get count of pending requests
 */
export function getPendingRequestCount(): number {
  return pendingRequests.size;
}

