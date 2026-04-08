import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger.js';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
  keyGenerator?: (req: Request) => string;
}

// In-memory store for rate limiting
const store = new Map<string, { count: number; resetTime: number }>();

// Cleanup stale entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now > record.resetTime) {
      store.delete(key);
    }
  }
}, 60000); // Clean up every minute

/**
 * Rate limiting middleware using in-memory store
 * Simplified and removed Redis dependency for infrastructure simplicity.
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
      const key = keyGenerator(req);
      const now = Date.now();
      
      let record = store.get(key);

      if (!record || now > record.resetTime) {
        record = { count: 0, resetTime: now + windowMs };
      }

      if (record.count >= maxRequests) {
        return res.status(429).json({
          success: false,
          error: message,
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        });
      }

      record.count++;
      store.set(key, record);

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (maxRequests - record.count).toString());
      res.setHeader('X-RateLimit-Reset', record.resetTime.toString());

      next();
    } catch (error) {
      // In-memory should not fail, but if it does, we fail CLOSED (security first)
      logger.error('Rate limit internal error', { error });
      res.status(500).json({ success: false, error: 'Internal server error' });
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
    maxRequests: 10, // Slightly relaxed for local testing but secure
    message: 'Too many authentication attempts, please try again later',
  }),

  // General API rate limit
  api: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  }),

  // Stricter limit for write operations
  write: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Too many requests, please slow down',
  }),

  // Very strict for expensive operations
  expensive: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'This operation is rate limited, please try again later',
  }),
};
