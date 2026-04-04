import { Router } from 'express';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { WagerService } from '../services/wager.service.js';
import { asyncHandler } from '../utils/async-handler.js';

export const positionsRouter = Router();
const wagerService = new WagerService();

/**
 * GET /api/positions
 * Get full user portfolio (active/settled positions + stats)
 */
positionsRouter.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const portfolio = await wagerService.getFullPortfolio(userId);

    res.json({
      success: true,
      data: portfolio,
      timestamp: Date.now(),
    });
  })
);

/**
 * GET /api/positions/stats
 * Get portfolio statistics only
 */
positionsRouter.get(
  '/stats',
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
 * GET /api/positions/market/:marketId
 * Get user positions for a specific market
 */
positionsRouter.get(
  '/market/:marketId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const { marketId } = req.params;
    
    const allPositions = await wagerService.getUserPositions(userId);
    const marketPositions = allPositions.filter(p => p.marketId === marketId);

    res.json({
      success: true,
      data: marketPositions,
      timestamp: Date.now(),
    });
  })
);
