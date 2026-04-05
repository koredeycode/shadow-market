import { Router } from 'express';
import { z } from 'zod';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { MarketService } from '../services/market.service.js';
import { WagerService } from '../services/wager.service.js';
import { asyncHandler } from '../utils/async-handler.js';

export const marketsRouter = Router();
const marketService = new MarketService();
const wagerService = new WagerService();

// Validation schemas
const createMarketSchema = z.object({
  question: z.string().min(10).max(500),
  description: z.string().max(2000).optional(),
  category: z.string().min(1).max(100),
  tags: z.array(z.string()).optional(),
  endTime: z.string().transform(val => new Date(val)),
  resolutionSource: z.string().min(1),
  onchainId: z.string().optional(),
  txHash: z.string().optional(),
});

const placeBetSchema = z.object({
  amount: z.string(),
  side: z.enum(['yes', 'no']),
  txHash: z.string().optional(),
  onchainId: z.string().optional(),
});

const createP2PWagerSchema = z.object({
  amount: z.string(),
  odds: z.tuple([z.number().positive(), z.number().positive()]),
  side: z.enum(['yes', 'no']),
  duration: z.number().positive(),
  txHash: z.string().optional(),
  onchainId: z.string().optional(),
});

const updateWagerSchema = z.object({
  status: z.enum(['OPEN', 'MATCHED', 'SETTLED', 'CANCELLED']),
  takerId: z.string().optional(),
  txHash: z.string().optional(),
});

const marketFiltersSchema = z.object({
  status: z.enum(['PENDING', 'OPEN', 'LOCKED', 'RESOLVED', 'CANCELLED']).optional(),
  category: z.string().optional(),
  sortBy: z.enum(['volume', 'ending_soon', 'newest']).optional(),
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
  asyncHandler(async (req: AuthRequest, res) => {
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
 * GET /api/markets/new
 * Get newly created markets
 */
marketsRouter.get(
  '/new',
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const markets = await marketService.getNewMarkets(limit);

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

/**
 * POST /api/markets/:id/upvote
 * Upvote a market
 */
marketsRouter.post(
  '/:id/upvote',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const market = await marketService.upvoteMarket(id, userId);

    res.json({
      success: true,
      data: market,
      timestamp: Date.now(),
    });
  })
);

/**
 * DELETE /api/markets/:id/upvote
 * Remove upvote from a market
 */
marketsRouter.delete(
  '/:id/upvote',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const market = await marketService.removeUpvote(id, userId);

    res.json({
      success: true,
      data: market,
      timestamp: Date.now(),
    });
  })
);

/**
 * GET /api/markets/:id/bets
 * List all AMM bets for a market
 */
marketsRouter.get(
  '/:id/bets',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const bets = await wagerService.getMarketBets(id);
    res.json({ success: true, data: bets });
  })
);

/**
 * POST /api/markets/:id/bets
 * Sync a new AMM bet for a market
 */
marketsRouter.post(
  '/:id/bets',
  authenticate,
  validate({ body: placeBetSchema }),
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const bet = await wagerService.placeBet(userId, { ...req.body, marketId: id });
    res.status(201).json({ success: true, data: bet });
  })
);

/**
 * GET /api/markets/:id/wagers
 * List all open P2P wagers for a market
 */
marketsRouter.get(
  '/:id/wagers',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const wagers = await wagerService.getMarketWagers(id);
    res.json({ success: true, data: wagers });
  })
);

/**
 * POST /api/markets/:id/wagers
 * Sync a new P2P wager for a market
 */
marketsRouter.post(
  '/:id/wagers',
  authenticate,
  validate({ body: createP2PWagerSchema }),
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const wager = await wagerService.createP2PWager(userId, { ...req.body, marketId: id });
    res.status(201).json({ success: true, data: wager });
  })
);

/**
 * PATCH /api/markets/:id/wagers/:wagerId
 * Update P2P wager status/taker after on-chain action
 */
marketsRouter.patch(
  '/:id/wagers/:wagerId',
  authenticate,
  validate({ body: updateWagerSchema }),
  asyncHandler(async (req: AuthRequest, res) => {
    const { wagerId } = req.params;
    const { status, takerId, txHash } = req.body;
    
    // Sync-only logic after client action
    const wager = await wagerService.updateWagerSync(wagerId, { status, takerId, txHash });
    res.json({ success: true, data: wager });
  })
);
