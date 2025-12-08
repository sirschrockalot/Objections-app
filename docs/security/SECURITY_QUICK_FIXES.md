# Security Quick Fixes Implementation Guide

This document provides step-by-step instructions for implementing the highest-priority security fixes.

## 🔴 Critical Fixes (Implement Immediately)

### 1. Add Security Headers

**File**: `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Adjust based on your needs
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.elevenlabs.io", // Add your API endpoints
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### 2. Strengthen Password Policy

**Files**: 
- `app/api/auth/register/route.ts`
- `app/api/auth/users/route.ts`
- `app/api/auth/change-password/route.ts`
- `app/api/auth/force-password-change/route.ts`

**Install dependency**:
```bash
npm install zod
```

**Create validation utility**: `lib/validation.ts`

```typescript
import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[@$!%*?&]/, 'Password must contain at least one special character (@$!%*?&)');

export const emailSchema = z.string().email('Invalid email address').max(255);

export function validatePassword(password: string): { valid: boolean; error?: string } {
  try {
    passwordSchema.parse(password);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: 'Invalid password' };
  }
}
```

**Update registration route**:
```typescript
import { validatePassword, emailSchema } from '@/lib/validation';

// Replace password validation
const passwordValidation = validatePassword(password);
if (!passwordValidation.valid) {
  return NextResponse.json(
    { error: passwordValidation.error },
    { status: 400 }
  );
}

// Replace email validation
try {
  emailSchema.parse(username);
} catch {
  return NextResponse.json(
    { error: 'Username must be a valid email address' },
    { status: 400 }
  );
}
```

### 3. Increase Bcrypt Rounds

**Files**: All files using `bcrypt.hash()`

**Change**:
```typescript
// From:
const passwordHash = await bcrypt.hash(password, 10);

// To:
const passwordHash = await bcrypt.hash(password, 12);
```

**Files to update**:
- `app/api/auth/register/route.ts`
- `app/api/auth/users/route.ts`
- `app/api/auth/change-password/route.ts`
- `app/api/auth/force-password-change/route.ts`

### 4. Sanitize Error Messages

**Create utility**: `lib/errorHandler.ts`

```typescript
export function getSafeErrorMessage(error: any, defaultMessage: string = 'An error occurred'): string {
  // In production, never expose internal error details
  if (process.env.NODE_ENV === 'production') {
    return defaultMessage;
  }
  
  // In development, show more details
  return error?.message || defaultMessage;
}

export function logError(context: string, error: any, metadata?: Record<string, any>) {
  console.error(`[${context}]`, {
    message: error?.message,
    stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    ...metadata,
  });
}
```

**Update all API routes**:
```typescript
import { getSafeErrorMessage, logError } from '@/lib/errorHandler';

// Replace:
catch (error: any) {
  console.error('Login error:', error);
  return NextResponse.json(
    { error: error.message || 'Login failed' },
    { status: 500 }
  );
}

// With:
catch (error: any) {
  logError('Login', error, { userId: user?._id });
  return NextResponse.json(
    { error: getSafeErrorMessage(error, 'Login failed. Please try again.') },
    { status: 500 }
  );
}
```

### 5. Add Request Size Limits

**File**: `next.config.ts`

```typescript
export default {
  // ... existing config
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '8mb',
  },
};
```

## 🟠 High Priority Fixes

### 6. Implement JWT Authentication

**Install dependencies**:
```bash
npm install jsonwebtoken
npm install --save-dev @types/jsonwebtoken
```

**Create JWT utility**: `lib/jwt.ts`

```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface JWTPayload {
  userId: string;
  isAdmin: boolean;
  email: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
```

**Update login route**:
```typescript
import { signToken } from '@/lib/jwt';

// After successful authentication:
const token = signToken({
  userId: user._id.toString(),
  isAdmin: user.isAdmin || false,
  email: user.username,
});

return NextResponse.json({
  user: {
    // ... user data
  },
  token, // Return token to client
});
```

**Create auth middleware**: `lib/authMiddleware.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';

export async function requireAuth(request: NextRequest): Promise<{
  authenticated: boolean;
  userId?: string;
  isAdmin?: boolean;
  error?: string;
}> {
  const token = getTokenFromRequest(request);
  
  if (!token) {
    return {
      authenticated: false,
      error: 'Authentication required',
    };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return {
      authenticated: false,
      error: 'Invalid or expired token',
    };
  }

  return {
    authenticated: true,
    userId: payload.userId,
    isAdmin: payload.isAdmin,
  };
}

export async function requireAdmin(request: NextRequest): Promise<{
  authenticated: boolean;
  userId?: string;
  error?: string;
}> {
  const auth = await requireAuth(request);
  
  if (!auth.authenticated) {
    return auth;
  }

  if (!auth.isAdmin) {
    return {
      authenticated: false,
      error: 'Admin access required',
    };
  }

  return {
    authenticated: true,
    userId: auth.userId,
  };
}
```

**Update API routes to use JWT**:
```typescript
import { requireAuth } from '@/lib/authMiddleware';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { error: auth.error },
      { status: 401 }
    );
  }

  const userId = auth.userId;
  // ... rest of handler
}
```

**Update client-side auth**: `lib/auth.ts`

```typescript
// Store token instead of full user object
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth-token', token);
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth-token');
}

export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth-token');
}

// Update API client to include token
export function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}
```

### 7. Add Server-Side Rate Limiting

**Option 1: Using Upstash (Recommended for production)**

```bash
npm install @upstash/ratelimit @upstash/redis
```

**Create rate limiter**: `lib/rateLimiter.ts`

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Different limiters for different endpoints
export const authRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '10 s'), // 5 requests per 10 seconds
});

export const apiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
});

export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit
): Promise<{ allowed: boolean; remaining: number }> {
  const { success, remaining } = await limiter.limit(identifier);
  return {
    allowed: success,
    remaining,
  };
}
```

**Use in API routes**:
```typescript
import { authRateLimiter, checkRateLimit } from '@/lib/rateLimiter';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  const rateLimit = await checkRateLimit(ip, authRateLimiter);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        },
      }
    );
  }

  // ... rest of handler
}
```

**Option 2: Simple in-memory rate limiting (for development)**

```typescript
// lib/simpleRateLimiter.ts
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkSimpleRateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowMs: number = 10000
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}
```

## 📝 Environment Variables

Add to `.env.local`:

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Rate Limiting (if using Upstash)
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# Security
NODE_ENV=production
```

## ✅ Testing the Fixes

After implementing fixes, test:

1. **Security Headers**: Use browser dev tools or `curl -I` to verify headers
2. **Password Policy**: Try weak passwords, verify they're rejected
3. **Rate Limiting**: Make rapid requests, verify 429 responses
4. **JWT**: Verify tokens expire correctly, invalid tokens are rejected
5. **Error Messages**: Verify production errors are generic

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All security headers configured
- [ ] Strong password policy enforced
- [ ] JWT authentication implemented
- [ ] Rate limiting active
- [ ] Error messages sanitized
- [ ] Environment variables set
- [ ] JWT_SECRET is strong and unique
- [ ] HTTPS enforced
- [ ] Security headers verified
- [ ] Rate limiting tested

---

**Note**: These are quick fixes. For comprehensive security, also implement:
- CSRF protection
- Account lockout
- Comprehensive audit logging
- Input sanitization library
- Request timeouts

