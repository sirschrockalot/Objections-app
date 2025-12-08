/**
 * Server-side AI response caching
 * Uses in-memory cache (node-cache) for fast access with MongoDB as persistence fallback
 * Reduces API costs by caching AI responses
 */

import NodeCache from 'node-cache';
import connectDB from '@/lib/mongodb';
import mongoose, { Schema, Model } from 'mongoose';
import crypto from 'crypto';

// In-memory cache with TTL support (primary cache)
const memoryCache = new NodeCache({
  stdTTL: 86400, // Default 24 hours
  checkperiod: 3600, // Check for expired keys every hour
  useClones: false, // Better performance
});

interface IAICache {
  _id: string;
  cacheKey: string;
  response: any;
  task: 'market-analysis' | 'feedback' | 'categorization' | 'other';
  createdAt: Date;
  expiresAt: Date;
}

const AICacheSchema = new Schema<IAICache>(
  {
    cacheKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    response: {
      type: Schema.Types.Mixed,
      required: true,
    },
    task: {
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
      // Index is defined below with TTL support
    },
  },
  {
    timestamps: false,
  }
);

// Index for efficient lookups and cleanup
AICacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-cleanup
AICacheSchema.index({ task: 1, cacheKey: 1 });

const AICache: Model<IAICache> =
  mongoose.models.AICache ||
  mongoose.model<IAICache>('AICache', AICacheSchema);

/**
 * Generate a cache key from input data
 */
export function generateCacheKey(task: string, input: any): string {
  const inputString = JSON.stringify(input);
  const hash = crypto.createHash('sha256').update(inputString).digest('hex');
  return `${task}:${hash}`;
}

/**
 * Get cached AI response
 * Checks in-memory cache first, then MongoDB as fallback
 */
export async function getCachedAIResponse<T>(
  task: 'market-analysis' | 'feedback' | 'categorization' | 'other',
  input: any
): Promise<T | null> {
  const cacheKey = generateCacheKey(task, input);
  
  // Try in-memory cache first (fastest)
  const memoryCached = memoryCache.get<T>(cacheKey);
  if (memoryCached !== undefined) {
    return memoryCached;
  }
  
  // Fallback to MongoDB (for persistence across restarts)
  try {
    await connectDB();
    const cached = await AICache.findOne({ cacheKey }).lean();
    
    if (!cached) {
      return null;
    }
    
    // Check if expired
    if (new Date() > new Date(cached.expiresAt)) {
      await AICache.deleteOne({ cacheKey });
      return null;
    }
    
    // Restore to memory cache for faster future access
    const ttl = Math.max(0, Math.floor((new Date(cached.expiresAt).getTime() - Date.now()) / 1000));
    if (ttl > 0) {
      memoryCache.set(cacheKey, cached.response, ttl);
    }
    
    return cached.response as T;
  } catch (error) {
    console.error('Error reading AI cache from MongoDB:', error);
    return null;
  }
}

/**
 * Cache AI response
 * Stores in both in-memory cache and MongoDB (for persistence)
 */
export async function cacheAIResponse<T>(
  task: 'market-analysis' | 'feedback' | 'categorization' | 'other',
  input: any,
  response: T,
  ttlSeconds: number = 86400 // Default 24 hours
): Promise<void> {
  const cacheKey = generateCacheKey(task, input);
  
  // Store in memory cache (fast access)
  memoryCache.set(cacheKey, response, ttlSeconds);
  
  // Also store in MongoDB for persistence (async, don't wait)
  try {
    await connectDB();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    
    await AICache.findOneAndUpdate(
      { cacheKey },
      {
        cacheKey,
        response,
        task,
        expiresAt,
        createdAt: new Date(),
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('Error caching AI response to MongoDB:', error);
    // Don't throw - MongoDB caching failures shouldn't break the app
    // In-memory cache is still working
  }
}

/**
 * Clear cache for a specific task
 */
export async function clearAICache(
  task?: 'market-analysis' | 'feedback' | 'categorization' | 'other'
): Promise<void> {
  // Clear memory cache
  if (task) {
    const keys = memoryCache.keys();
    keys.forEach(key => {
      if (key.startsWith(`${task}:`)) {
        memoryCache.del(key);
      }
    });
  } else {
    memoryCache.flushAll();
  }
  
  // Clear MongoDB cache
  try {
    await connectDB();
    if (task) {
      await AICache.deleteMany({ task });
    } else {
      await AICache.deleteMany({});
    }
  } catch (error) {
    console.error('Error clearing AI cache from MongoDB:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getAICacheStats(): Promise<{
  totalEntries: number;
  entriesByTask: Record<string, number>;
  oldestEntry: Date | null;
  newestEntry: Date | null;
}> {
  try {
    await connectDB();
    const totalEntries = await AICache.countDocuments();
    const entries = await AICache.aggregate([
      {
        $group: {
          _id: '$task',
          count: { $sum: 1 },
        },
      },
    ]);
    
    const entriesByTask: Record<string, number> = {};
    entries.forEach(entry => {
      entriesByTask[entry._id] = entry.count;
    });
    
    const oldest = await AICache.findOne().sort({ createdAt: 1 }).lean();
    const newest = await AICache.findOne().sort({ createdAt: -1 }).lean();
    
    return {
      totalEntries,
      entriesByTask,
      oldestEntry: oldest?.createdAt || null,
      newestEntry: newest?.createdAt || null,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return {
      totalEntries: 0,
      entriesByTask: {},
      oldestEntry: null,
      newestEntry: null,
    };
  }
}

