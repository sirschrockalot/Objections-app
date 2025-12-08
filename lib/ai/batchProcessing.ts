/**
 * Batch processing utilities for AI calls
 * Reduces API costs by batching multiple requests into single API calls
 */

import { getCachedAIResponse, cacheAIResponse } from '@/lib/cache/aiCache';

/**
 * Batch analyze multiple properties
 * Groups similar requests and processes them together when possible
 */
export async function batchAnalyzeProperties<T>(
  requests: Array<{ input: any; task: 'market-analysis' | 'feedback' | 'categorization' | 'other' }>,
  processFn: (input: any) => Promise<T>
): Promise<T[]> {
  // Check cache for all requests first
  const results: Array<T | null> = await Promise.all(
    requests.map(req => getCachedAIResponse<T>(req.task, req.input))
  );

  // Find requests that need processing
  const toProcess: Array<{ index: number; input: any; task: string }> = [];
  results.forEach((result, index) => {
    if (result === null) {
      toProcess.push({
        index,
        input: requests[index].input,
        task: requests[index].task,
      });
    }
  });

  // Process uncached requests
  if (toProcess.length > 0) {
    const processed = await Promise.all(
      toProcess.map(item => processFn(item.input))
    );

    // Update results and cache
    toProcess.forEach((item, i) => {
      results[item.index] = processed[i];
      cacheAIResponse(
        item.task as any,
        item.input,
        processed[i],
        86400 // 24 hours
      );
    });
  }

  return results.filter((r): r is T => r !== null);
}

/**
 * Batch process with concurrency limit
 * Useful for rate-limited APIs
 */
export async function batchProcessWithLimit<T, R>(
  items: T[],
  processFn: (item: T) => Promise<R>,
  concurrency: number = 5
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(item => processFn(item))
    );
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Group similar requests for batch processing
 */
export function groupSimilarRequests<T>(
  requests: T[],
  groupKey: (req: T) => string,
  maxGroupSize: number = 10
): T[][] {
  const groups = new Map<string, T[]>();
  
  requests.forEach(req => {
    const key = groupKey(req);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    const group = groups.get(key)!;
    if (group.length < maxGroupSize) {
      group.push(req);
    }
  });
  
  return Array.from(groups.values());
}

