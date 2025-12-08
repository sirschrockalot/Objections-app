import { createApiHandler } from '@/lib/api/routeHandler';
import { RATE_LIMITS } from '@/lib/rateLimiter';

export const GET = createApiHandler({
  rateLimit: RATE_LIMITS.read,
  requireAuth: true,
  errorContext: 'Get user',
  handler: async (req, { userId, email, isAdmin }) => {
    return {
      user: {
        id: userId,
        email,
        isAdmin,
      },
    };
  },
});

