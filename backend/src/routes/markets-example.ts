import { and, desc, eq } from 'drizzle-orm';
import express from 'express';
import { db } from '../db/client';
import { markets } from '../db/schema';
import { cacheConfigs } from '../middleware/cache';
import { AppError, asyncHandler } from '../middleware/error-handler';
import { rateLimits } from '../middleware/rate-limit';

export const marketsRouter = express.Router();

/**
 * GET /api/markets
 * Get all markets with optional filters
 * - Cached for 1 minute (medium cache)
 * - Rate limited to 60 req/min
 */
marketsRouter.get(
  '/',
  rateLimits.api,
  cacheConfigs.medium,
  asyncHandler(async (req, res) => {
    const { status, category, sortBy, limit = 50 } = req.query;

    let query = db.select().from(markets);

    // Apply filters
    const conditions = [];
    if (status) conditions.push(eq(markets.status, status as any));
    if (category) conditions.push(eq(markets.category, category as string));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Apply sorting
    if (sortBy === 'volume') {
      query = query.orderBy(desc(markets.totalVolume)) as any;
    } else if (sortBy === 'ending_soon') {
      query = query.orderBy(markets.endTime) as any;
    } else {
      query = query.orderBy(desc(markets.createdAt)) as any;
    }

    query = query.limit(Number(limit)) as any;

    const results = await query;

    res.json({
      success: true,
      data: results,
      count: results.length,
    });
  })
);

/**
 * GET /api/markets/:id
 * Get single market by ID
 * - Cached for 10 seconds (short cache - frequently updated)
 * - Rate limited to 60 req/min
 */
marketsRouter.get(
  '/:id',
  rateLimits.api,
  cacheConfigs.short,
  asyncHandler(async (req, res) => {
    const market = await db.query.markets.findFirst({
      where: eq(markets.id, req.params.id),
      with: {
        creator: true,
        positions: {
          limit: 10,
          orderBy: (positions, { desc }) => [desc(positions.entryTimestamp)],
        },
      },
    });

    if (!market) {
      throw new AppError(404, 'Market not found');
    }

    res.json({
      success: true,
      data: market,
    });
  })
);

/**
 * POST /api/markets
 * Create new market
 * - Stricter rate limit: 20 req/min
 * - No caching (POST request)
 */
marketsRouter.post(
  '/',
  rateLimits.write,
  asyncHandler(async (req, res) => {
    // Validation would happen here via validate middleware
    const { question, description, category, endTime, minBet, maxBet } = req.body;

    // Create market logic...
    const [newMarket] = await db
      .insert(markets)
      .values({
        id: `market_${Date.now()}`,
        onchainId: `onchain_${Date.now()}`,
        contractAddress: `0x${Date.now().toString(16)}`,
        question,
        description,
        category,
        status: 'PENDING',
        endTime: new Date(endTime),
        resolutionSource: req.body.resolutionSource || 'manual',
        minBet,
        maxBet,
        creatorId: req.user?.id || 'test_user', // From auth middleware
      })
      .returning();

    res.status(201).json({
      success: true,
      data: newMarket,
    });
  })
);

/**
 * Example showing all middleware types
 */
// marketsRouter.post(
//   '/expensive-operation',
//   rateLimits.auth,           // Very strict rate limit
//   requireAuth,                // Auth middleware
//   validate(marketSchema),     // Validation middleware
//   asyncHandler(async (req, res) => {
//     // Handle expensive operation
//   }),
// );
