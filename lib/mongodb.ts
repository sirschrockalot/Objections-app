// This module is server-only and should never be imported in client components
if (typeof window !== 'undefined') {
  throw new Error('lib/mongodb.ts is a server-only module and cannot be imported in client components');
}

import mongoose from 'mongoose';
import { validateEnvVars } from './envValidation';

// Validate environment variables on first import (skip during build)
// Only validate at runtime, not during Next.js build process
if (typeof window === 'undefined' && process.env.NEXT_PHASE !== 'phase-production-build') {
  try {
    validateEnvVars();
  } catch (error) {
    console.error('Environment variable validation failed:', error);
    // In production runtime, we want to exit, but during build we'll just warn
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
      throw error;
    }
  }
}

function getMongoDBUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }
  return uri;
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Use global cache to prevent multiple connections in development
declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(getMongoDBUri(), opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;

