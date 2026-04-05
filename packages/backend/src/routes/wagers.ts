import { Router } from 'express';
import { z } from 'zod';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { WagerService } from '../services/wager.service.js';
import { asyncHandler } from '../utils/async-handler.js';

export const wagersRouter = Router();
const wagerService = new WagerService();

// Validation schemas
const placeBetSchema = z.object({
  marketId: z.string(),
  amount: z.string(),
  side: z.enum(['yes', 'no']),
  slippage: z.number().min(0).max(50).optional(),
  txHash: z.string().optional(),
  onchainId: z.string().optional(),
});

const createP2PWagerSchema = z.object({
  marketId: z.string(),
  amount: z.string(),
  odds: z.tuple([z.number().positive(), z.number().positive()]),
  side: z.enum(['yes', 'no']),
  duration: z.number().positive(),
  txHash: z.string().optional(),
  onchainId: z.string().optional(),
});

/**
 * POST /api/wagers
 * Place bet on market (AMM)
 */
wagersRouter.post(
  '/',
  authenticate,
  validate({ body: placeBetSchema }),
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const bet = await wagerService.placeBet(userId, req.body);

    res.status(201).json({
      success: true,
      data: bet,
      timestamp: Date.now(),
    });
  })
);

/**
 * POST /api/wagers/p2p
 * Create P2P wager offer
 */
wagersRouter.post(
  '/p2p',
  authenticate,
  validate({ body: createP2PWagerSchema }),
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const wager = await wagerService.createP2PWager(userId, req.body);

    res.status(201).json({
      success: true,
      data: wager,
      timestamp: Date.now(),
    });
  })
);

/**
 * POST /api/wagers/p2p/:id/accept
 * Accept P2P wager
 */
wagersRouter.post(
  '/p2p/:id/accept',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const { id } = req.params;

    const wager = await wagerService.acceptP2PWager(userId, id);

    res.json({
      success: true,
      data: wager,
      timestamp: Date.now(),
    });
  })
);

/**
 * DELETE /api/wagers/p2p/:id
 * Cancel open wager
 */
wagersRouter.delete(
  '/p2p/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const { id } = req.params;

    const wager = await wagerService.cancelWager(userId, id);

    res.json({
      success: true,
      data: wager,
      timestamp: Date.now(),
    });
  })
);

/**
 * GET /api/wagers/user
 * Get user's wagers
 */
wagersRouter.get(
  '/user',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const wagers = await wagerService.getUserWagers(userId);

    res.json({
      success: true,
      data: wagers,
      timestamp: Date.now(),
    });
  })
);

/**
 * GET /api/wagers/bets
 * Get user's bets
 */
wagersRouter.get(
  '/bets',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const bets = await wagerService.getUserBets(userId);

    res.json({
      success: true,
      data: bets,
      timestamp: Date.now(),
    });
  })
);

/**
 * GET /api/wagers/portfolio
 * Get portfolio statistics
 */
wagersRouter.get(
  '/portfolio',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const stats = await wagerService.getPortfolioStats(userId);

    res.json({
      success: true,
      data: stats,
      timestamp: Date.now(),
    });
  })
);

/**
 * POST /api/wagers/:id/claim
 * Claim winnings from settled position
 */
wagersRouter.post(
  '/:id/claim',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const { id } = req.params;

    const bet = await wagerService.claimWinnings(userId, id);

    res.json({
      success: true,
      data: bet,
      timestamp: Date.now(),
    });
  })
);

/**
 * GET /api/wagers/market/:marketId
 * Get open P2P wagers for a market
 */
wagersRouter.get(
  '/market/:marketId',
  asyncHandler(async (req, res) => {
    const { marketId } = req.params;
    const wagers = await wagerService.getMarketWagers(marketId);

    res.json({
      success: true,
      data: wagers,
      timestamp: Date.now(),
    });
  })
);
/**
 * GET /api/wagers/:id
 * Get single wager details
 */
wagersRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const wager = await wagerService.getWagerById(id);

    res.json({
      success: true,
      data: wager,
      timestamp: Date.now(),
    });
  })
);
