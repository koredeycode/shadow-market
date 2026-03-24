import { Router } from 'express';
import { MarketService } from '../services/market.service';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import { asyncHandler } from '../utils/async-handler';

export const marketsRouter = Router();
const marketService = new MarketService();

// Validation schemas
const createMarketSchema = z.object({
  question: z.string().min(10).max(500),
  description: z.string().max(2000).optional(),
  marketType: z.enum(['BINARY', 'CATEGORICAL', 'SCALAR']),
  category: z.string().min(1).max(100),
  tags: z.array(z.string()).optional(),
  endTime: z.string().transform((val) => new Date(val)),
  resolutionSource: z.string().min(1),
  minBet: z.string(),
  maxBet: z.string(),
});

const marketFiltersSchema = z.object({
  status: z.enum(['PENDING', 'OPEN', 'LOCKED', 'RESOLVED', 'CANCELLED']).optional(),
  category: z.string().optional(),
  sortBy: z.enum(['volume', 'liquidity', 'ending_soon', 'newest']).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

/**
 * GET /api/markets
 * List all markets with filters
 */
marketsRouter.get(
  '/',
  validate({ query: marketFiltersSchema }),
  asyncHandler(async (req, res) => {
    const filters = req.query;
    const result = await marketService.getMarkets(filters as any);

    res.json({
      success: true,
      data: result,
      timestamp: Date.now(),
    });
  })
);

/**
 * POST /api/markets
 * Create new market (authenticated)
 */
marketsRouter.post(
  '/',
  authenticate,
  validate({ body: createMarketSchema }),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const market = await marketService.createMarket(userId, req.body);

    res.status(201).json({
      success: true,
      data: market,
      timestamp: Date.now(),
    });
  })
);

/**
 * GET /api/markets/trending
 * Get trending markets
 */
marketsRouter.get(
  '/trending',
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const markets = await marketService.getTrendingMarkets(limit);

    res.json({
      success: true,
      data: markets,
      timestamp: Date.now(),
    });
  })
);

/**
 * GET /api/markets/search
 * Search markets
 */
marketsRouter.get(
  '/search',
  asyncHandler(async (req, res) => {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter required',
      });
    }

    const markets = await marketService.searchMarkets(query, limit);

    res.json({
      success: true,
      data: markets,
      timestamp: Date.now(),
    });
  })
);

/**
 * GET /api/markets/:id
 * Get single market details
 */
marketsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const market = await marketService.getMarketById(id);

    if (!market) {
      return res.status(404).json({
        success: false,
        error: 'Market not found',
      });
    }

    res.json({
      success: true,
      data: market,
      timestamp: Date.now(),
    });
  })
);

/**
 * GET /api/markets/:id/chart
 * Get price history for charting
 */
marketsRouter.get(
  '/:id/chart',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const timeRange = (req.query.range as any) || '24h';

    const priceHistory = await marketService.getPriceHistory(id, timeRange);

    res.json({
      success: true,
      data: priceHistory,
      timestamp: Date.now(),
    });
  })
);

/**
 * GET /api/markets/:id/stats
 * Get market statistics
 */
marketsRouter.get(
  '/:id/stats',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const stats = await marketService.getMarketStats(id);

    res.json({
      success: true,
      data: stats,
      timestamp: Date.now(),
    });
  })
);
