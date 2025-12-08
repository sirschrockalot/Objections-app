# Logging Configuration Guide

## Overview

The app uses a centralized logging system with configurable log levels to reduce Heroku log costs. By default, only **ERROR** level logs are enabled in production.

## Log Levels

- **DEBUG** (0): Detailed debugging information (development only)
- **INFO** (1): Informational messages (disabled in production by default)
- **WARN** (2): Warning messages (enabled in production)
- **ERROR** (3): Error messages (always enabled)
- **NONE** (4): No logging (not recommended)

## Default Behavior

- **Development**: `DEBUG` level (all logs enabled)
- **Production**: `ERROR` level (only errors logged)

## Configuration

### Heroku Environment Variable

Set the `LOG_LEVEL` environment variable on Heroku:

```bash
# Only log errors (default, lowest cost)
heroku config:set LOG_LEVEL=ERROR

# Log warnings and errors
heroku config:set LOG_LEVEL=WARN

# Log info, warnings, and errors (higher cost)
heroku config:set LOG_LEVEL=INFO

# Log everything including debug (highest cost, not recommended)
heroku config:set LOG_LEVEL=DEBUG
```

### Local Development

Create or update `.env.local`:

```env
# Development - see all logs
LOG_LEVEL=DEBUG

# Or match production for testing
LOG_LEVEL=ERROR
```

## Cost Impact

**Heroku Log Costs:**
- Log retention: 7 days (free tier), 14+ days (paid)
- Log volume: Charged per GB of log data
- **Recommendation**: Keep `LOG_LEVEL=ERROR` in production to minimize costs

**Estimated Log Volume Reduction:**
- `ERROR` only: ~90% reduction vs. full logging
- `WARN` + `ERROR`: ~70% reduction
- `INFO` + `WARN` + `ERROR`: ~40% reduction

## Usage in Code

### Import the Logger

```typescript
import { debug, info, warn, error, log } from '@/lib/logger';
```

### Examples

```typescript
// Debug messages (development only)
debug('Processing user request', { userId });

// Info messages (disabled in production by default)
info('User logged in', { userId });

// Warnings (enabled in production)
warn('Rate limit approaching', { remaining: 5 });

// Errors (always enabled)
error('Failed to save data', error, { userId, action: 'save' });

// Structured logging with context
log('API Handler', LogLevel.ERROR, 'Request failed', { endpoint, status });
```

## Migration Status

The following files have been migrated to use the centralized logger:
- ✅ `lib/errorHandler.ts`
- ✅ `lib/apiClient.ts`
- ✅ `lib/storage.ts` (partial)
- ⏳ Other files still use `console.log/error/warn` (will be migrated gradually)

## Best Practices

1. **Use appropriate log levels:**
   - `debug()`: Detailed debugging info
   - `info()`: Important events (user actions, state changes)
   - `warn()`: Potential issues that don't break functionality
   - `error()`: Actual errors that need attention

2. **Include context:**
   ```typescript
   error('Database query failed', error, { 
     userId, 
     query: 'getUserStats',
     timestamp: new Date().toISOString()
   });
   ```

3. **Avoid logging sensitive data:**
   - Never log passwords, tokens, or API keys
   - Sanitize user input before logging
   - Use metadata objects for structured data

4. **Client-side logging:**
   - Client-side `console.log` statements are not sent to Heroku logs
   - Only server-side logs affect Heroku costs
   - Consider removing excessive client-side logging for performance

## Monitoring

Check current log level:
```typescript
import { getCurrentLogLevel } from '@/lib/logger';
console.log('Current log level:', getCurrentLogLevel());
```

View Heroku logs:
```bash
heroku logs --tail
heroku logs --num 1000 | grep ERROR
```

## Troubleshooting

**Too many logs in production:**
1. Verify `LOG_LEVEL=ERROR` is set: `heroku config:get LOG_LEVEL`
2. Check for remaining `console.log` statements in server-side code
3. Review API routes for excessive logging

**Not seeing enough logs:**
1. Temporarily set `LOG_LEVEL=INFO` or `LOG_LEVEL=DEBUG`
2. Remember to set back to `ERROR` after debugging
3. Use structured logging for better filtering

