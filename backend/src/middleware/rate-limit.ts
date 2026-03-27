import { NextFunction, Request, Response } from 'express';
import { createClient } from 'redis';
import { config } from '../config.js';

// Redis client for rate limiting
const redisClient = createClient({
  url: config.redisUrl,
});

redisClient.on('error', err => console.error('Redis Client Error:', err));
redisClient.connect().catch(console.error);

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
  keyGenerator?: (req: Request) => string;
}

/**
 * Rate limiting middleware using Redis
 */
export function rateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later',
    keyGenerator = req => req.ip || 'unknown',
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = `ratelimit:${keyGenerator(req)}`;
      const windowStart = Date.now();

      // Get current count
      const count = await redisClient.get(key);
      const currentCount = count ? parseInt(count, 10) : 0;

      if (currentCount >= maxRequests) {
        return res.status(429).json({
          success: false,
          error: message,
          retryAfter: Math.ceil(windowMs / 1000),
        });
      }

      // Increment counter
      if (currentCount === 0) {
        await redisClient.setEx(key, Math.ceil(windowMs / 1000), '1');
      } else {
        await redisClient.incr(key);
      }

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (maxRequests - currentCount - 1).toString());
      res.setHeader('X-RateLimit-Reset', (windowStart + windowMs).toString());

      next();
    } catch (error) {
      // If Redis fails, allow the request (fail open)
      console.error('Rate limit error:', error);
      next();
    }
  };
}

/**
 * Rate limit configurations for different endpoints
 */
export const rateLimits = {
  // Strict rate limit for auth endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later',
  }),

  // General API rate limit
  api: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  }),

  // Stricter limit for write operations
  write: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    message: 'Too many requests, please slow down',
  }),

  // Very strict for expensive operations
  expensive: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'This operation is rate limited, please try again later',
  }),
};

export { redisClient };
