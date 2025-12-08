/**
 * Database query result caching
 * Uses in-memory cache (node-cache) for fast access with MongoDB as persistence fallback
 * Reduces database load by caching frequently accessed query results
 */

import NodeCache from 'node-cache';
import connectDB from '@/lib/mongodb';
import mongoose, { Schema, Model } from 'mongoose';
import crypto from 'crypto';

// In-memory cache with TTL support (primary cache)
const memoryCache = new NodeCache({
  stdTTL: 300, // Default 5 minutes
  checkperiod: 60, // Check for expired keys every minute
  useClones: false, // Better performance
});

interface IQueryCache {
  _id: string;
  cacheKey: string;
  result: any;
  model: string; // Model name for context
  createdAt: Date;
  expiresAt: Date;
}

const QueryCacheSchema = new Schema<IQueryCache>(
  {
    cacheKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    result: {
      type: Schema.Types.Mixed,
      required: true,
    },
    model: {
      type: String,
      required: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// TTL index for auto-cleanup
QueryCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
QueryCacheSchema.index({ model: 1, cacheKey: 1 });

const QueryCache: Model<IQueryCache> =
  mongoose.models.QueryCache ||
  mongoose.model<IQueryCache>('QueryCache', QueryCacheSchema);

/**
 * Generate a cache key from query parameters
 */
export function generateQueryCacheKey(model: string, query: any): string {
  const queryString = JSON.stringify(query);
  const hash = crypto.createHash('sha256').update(queryString).digest('hex');
  return `${model}:${hash}`;
}

/**
 * Get cached query result
 * Checks in-memory cache first, then MongoDB as fallback
 */
export async function getCachedQuery<T>(
  model: string,
  query: any
): Promise<T | null> {
  const cacheKey = generateQueryCacheKey(model, query);
  
  // Try in-memory cache first (fastest)
  const memoryCached = memoryCache.get<T>(cacheKey);
  if (memoryCached !== undefined) {
    return memoryCached;
  }
  
  // Fallback to MongoDB (for persistence across restarts)
  try {
    await connectDB();
    const cached = await QueryCache.findOne({ cacheKey }).lean();
    
    if (!cached) {
      return null;
    }
    
    // Check if expired
    if (new Date() > new Date(cached.expiresAt)) {
      await QueryCache.deleteOne({ cacheKey });
      return null;
    }
    
    // Restore to memory cache for faster future access
    const ttl = Math.max(0, Math.floor((new Date(cached.expiresAt).getTime() - Date.now()) / 1000));
    if (ttl > 0) {
      memoryCache.set(cacheKey, cached.result, ttl);
    }
    
    return cached.result as T;
  } catch (error) {
    console.error('Error reading query cache from MongoDB:', error);
    return null;
  }
}

/**
 * Cache query result
 * Stores in both in-memory cache and MongoDB (for persistence)
 */
export async function cacheQueryResult<T>(
  model: string,
  query: any,
  result: T,
  ttlSeconds: number = 300 // Default 5 minutes
): Promise<void> {
  const cacheKey = generateQueryCacheKey(model, query);
  
  // Store in memory cache (fast access)
  memoryCache.set(cacheKey, result, ttlSeconds);
  
  // Also store in MongoDB for persistence (async, don't wait)
  try {
    await connectDB();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    
    await QueryCache.findOneAndUpdate(
      { cacheKey },
      {
        cacheKey,
        result,
        model,
        expiresAt,
        createdAt: new Date(),
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('Error caching query result to MongoDB:', error);
    // Don't throw - MongoDB caching failures shouldn't break the app
    // In-memory cache is still working
  }
}

/**
 * Clear cache for a specific model
 */
export async function clearQueryCache(model?: string): Promise<void> {
  // Clear memory cache
  if (model) {
    const keys = memoryCache.keys();
    keys.forEach(key => {
      if (key.startsWith(`${model}:`)) {
        memoryCache.del(key);
      }
    });
  } else {
    memoryCache.flushAll();
  }
  
  // Clear MongoDB cache
  try {
    await connectDB();
    if (model) {
      await QueryCache.deleteMany({ model });
    } else {
      await QueryCache.deleteMany({});
    }
  } catch (error) {
    console.error('Error clearing query cache from MongoDB:', error);
  }
}

/**
 * Wrapper function to cache any async query
 */
export async function getCachedQueryResult<T>(
  model: string,
  query: any,
  queryFn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  // Try cache first
  const cached = await getCachedQuery<T>(model, query);
  if (cached !== null) {
    return cached;
  }
  
  // Execute query
  const result = await queryFn();
  
  // Cache result
  await cacheQueryResult(model, query, result, ttlSeconds);
  
  return result;
}

