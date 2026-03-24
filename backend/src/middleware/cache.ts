import { NextFunction, Request, Response } from 'express';
import { redisClient } from './rate-limit';

interface CacheOptions {
  ttl: number; // Time to live in seconds
  keyPrefix?: string;
  keyGenerator?: (req: Request) => string;
}

/**
 * Response caching middleware using Redis
 */
export function cacheMiddleware(options: CacheOptions) {
  const {
    ttl,
    keyPrefix = 'cache',
    keyGenerator = req => `${req.method}:${req.originalUrl}`,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const cacheKey = `${keyPrefix}:${keyGenerator(req)}`;

      // Check cache
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        res.setHeader('X-Cache', 'HIT');
        return res.json(parsed);
      }

      // Cache miss - intercept json() method to cache response
      const originalJson = res.json.bind(res);
      res.json = function (data: any) {
        // Cache the response
        redisClient
          .setEx(cacheKey, ttl, JSON.stringify(data))
          .catch(err => console.error('Cache set error:', err));

        res.setHeader('X-Cache', 'MISS');
        return originalJson(data);
      };

      next();
    } catch (error) {
      // If cache fails, continue without caching
      console.error('Cache middleware error:', error);
      next();
    }
  };
}

/**
 * Cache invalidation helper
 */
export async function invalidateCache(pattern: string) {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`Invalidated ${keys.length} cache entries matching ${pattern}`);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

/**
 * Predefined cache configurations
 */
export const cacheConfigs = {
  // Short cache for frequently changing data
  short: cacheMiddleware({
    ttl: 10, // 10 seconds
    keyPrefix: 'cache:short',
  }),

  // Medium cache for semi-static data
  medium: cacheMiddleware({
    ttl: 60, // 1 minute
    keyPrefix: 'cache:medium',
  }),

  // Long cache for static data
  long: cacheMiddleware({
    ttl: 300, // 5 minutes
    keyPrefix: 'cache:long',
  }),

  // Very long cache for rarely changing data
  veryLong: cacheMiddleware({
    ttl: 3600, // 1 hour
    keyPrefix: 'cache:verylong',
  }),
};
