import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger.js';

interface CacheOptions {
  ttl: number; // Time to live in seconds
  keyPrefix?: string;
  keyGenerator?: (req: Request) => string;
}

/**
 * Simple In-memory store to replace Redis for caching
 */
const memoryCache = new Map<string, { data: string; expires: number }>();

/**
 * Response caching middleware using In-memory Store
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
      const now = Date.now();

      // Check cache
      const cached = memoryCache.get(cacheKey);
      if (cached && cached.expires > now) {
        const parsed = JSON.parse(cached.data);
        res.setHeader('X-Cache', 'HIT');
        return res.json(parsed);
      } else if (cached) {
        memoryCache.delete(cacheKey);
      }

      // Cache miss - intercept json() method to cache response
      const originalJson = res.json.bind(res);
      res.json = function (data: any) {
        // Cache the response
        memoryCache.set(cacheKey, {
          data: JSON.stringify(data),
          expires: Date.now() + (ttl * 1000)
        });

        res.setHeader('X-Cache', 'MISS');
        return originalJson(data);
      };

      next();
    } catch (error) {
      // If cache fails, continue without caching
      logger.error('Cache middleware error', { error });
      next();
    }
  };
}

/**
 * Cache invalidation helper
 */
export async function invalidateCache(pattern: string) {
  try {
    const keys = Array.from(memoryCache.keys()).filter(k => k.includes(pattern));
    keys.forEach(k => memoryCache.delete(k));
    logger.info('Cache invalidated', { pattern, count: keys.length });
  } catch (error) {
    logger.error('Cache invalidation error', { error, pattern });
  }
}

/**
 * Predefined cache configurations
 */
export const cacheConfigs = {
  short: cacheMiddleware({ ttl: 10, keyPrefix: 'cache:short' }),
  medium: cacheMiddleware({ ttl: 60, keyPrefix: 'cache:medium' }),
  long: cacheMiddleware({ ttl: 300, keyPrefix: 'cache:long' }),
  veryLong: cacheMiddleware({ ttl: 3600, keyPrefix: 'cache:verylong' }),
};
