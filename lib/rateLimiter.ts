/**
 * Server-side rate limiting
 * Uses in-memory cache (node-cache) for fast access with MongoDB as persistence fallback
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import NodeCache from 'node-cache';
import connectDB from '@/lib/mongodb';
import mongoose, { Schema, Model } from 'mongoose';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface IRateLimit {
  _id: string;
  identifier: string;
  count: number;
  resetTime: Date;
  createdAt: Date;
}

const RateLimitSchema = new Schema<IRateLimit>(
  {
    identifier: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    count: {
      type: Number,
      required: true,
    },
    resetTime: {
      type: Date,
      required: true,
      // Index is defined below with TTL support
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// TTL index for auto-cleanup
RateLimitSchema.index({ resetTime: 1 }, { expireAfterSeconds: 0 });

const RateLimit: Model<IRateLimit> =
  mongoose.models.RateLimit ||
  mongoose.model<IRateLimit>('RateLimit', RateLimitSchema);

// In-memory rate limit store (primary cache)
const memoryCache = new NodeCache({
  stdTTL: 900, // Default 15 minutes
  checkperiod: 300, // Check for expired keys every 5 minutes
  useClones: false,
});

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Check rate limit for an identifier (IP address or user ID)
 * Uses in-memory cache first, then MongoDB as fallback
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const cacheKey = `ratelimit:${identifier}`;
  
  // Try in-memory cache first
  const memoryCached = memoryCache.get<RateLimitRecord>(cacheKey);
  if (memoryCached !== undefined) {
    // Check if expired
    if (now > memoryCached.resetTime) {
      memoryCache.del(cacheKey);
      // Create new record
      const newRecord: RateLimitRecord = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      memoryCache.set(cacheKey, newRecord, Math.ceil(config.windowMs / 1000));
      
      // Also save to MongoDB (async)
      saveRateLimitToDB(identifier, newRecord).catch(console.error);
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: newRecord.resetTime,
      };
    }
    
    // Check if limit exceeded
    if (memoryCached.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: memoryCached.resetTime,
      };
    }
    
    // Increment count
    memoryCached.count++;
    memoryCache.set(cacheKey, memoryCached, Math.ceil((memoryCached.resetTime - now) / 1000));
    
    // Also save to MongoDB (async)
    saveRateLimitToDB(identifier, memoryCached).catch(console.error);
    
    return {
      allowed: true,
      remaining: config.maxRequests - memoryCached.count,
      resetTime: memoryCached.resetTime,
    };
  }
  
  // Fallback to MongoDB
  try {
    await connectDB();
    const dbRecord = await RateLimit.findOne({ identifier }).lean();
    
    if (!dbRecord || now > new Date(dbRecord.resetTime).getTime()) {
      // Create new record
      const newRecord: RateLimitRecord = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      
      // Store in both memory and DB
      memoryCache.set(cacheKey, newRecord, Math.ceil(config.windowMs / 1000));
      await saveRateLimitToDB(identifier, newRecord);
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: newRecord.resetTime,
      };
    }
    
    // Check if limit exceeded
    if (dbRecord.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(dbRecord.resetTime).getTime(),
      };
    }
    
    // Increment count
    const updatedRecord: RateLimitRecord = {
      count: dbRecord.count + 1,
      resetTime: new Date(dbRecord.resetTime).getTime(),
    };
    
    // Store in both memory and DB
    const ttl = Math.max(0, Math.ceil((updatedRecord.resetTime - now) / 1000));
    memoryCache.set(cacheKey, updatedRecord, ttl);
    await saveRateLimitToDB(identifier, updatedRecord);
    
    return {
      allowed: true,
      remaining: config.maxRequests - updatedRecord.count,
      resetTime: updatedRecord.resetTime,
    };
  } catch (error) {
    console.error('Error checking rate limit in MongoDB:', error);
    // Fallback to in-memory only
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    memoryCache.set(cacheKey, newRecord, Math.ceil(config.windowMs / 1000));
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newRecord.resetTime,
    };
  }
}

/**
 * Save rate limit to MongoDB (async helper)
 */
async function saveRateLimitToDB(identifier: string, record: RateLimitRecord): Promise<void> {
  try {
    await connectDB();
    await RateLimit.findOneAndUpdate(
      { identifier },
      {
        identifier,
        count: record.count,
        resetTime: new Date(record.resetTime),
        createdAt: new Date(),
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('Error saving rate limit to MongoDB:', error);
  }
}

/**
 * Get client identifier from request (IP address or user ID)
 */
export function getClientIdentifier(request: NextRequest, userId?: string): string {
  // Prefer user ID if available (more accurate for authenticated users)
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fall back to IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
  
  return `ip:${ip}`;
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  // Strict limits for authentication endpoints
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // Moderate limits for general API endpoints
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  // Lenient limits for read-only endpoints
  read: {
    maxRequests: 200,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;

/**
 * Create rate limit middleware function
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async (request: NextRequest, userId?: string): Promise<{
    allowed: boolean;
    response?: NextResponse;
    remaining: number;
  }> => {
    const identifier = getClientIdentifier(request, userId);
    const result = await checkRateLimit(identifier, config);

    if (!result.allowed) {
      const response = NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
      return {
        allowed: false,
        response,
        remaining: result.remaining,
      };
    }

    return {
      allowed: true,
      remaining: result.remaining,
    };
  };
}

