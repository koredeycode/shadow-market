import { Router } from 'express';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { WagerService } from '../services/wager.service.js';
import { asyncHandler } from '../utils/async-handler.js';

export const betsRouter = Router();
const wagerService = new WagerService();

/**
 * GET /api/bets
 * Get full user portfolio (active/settled bets + stats)
 */
betsRouter.get(
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
 * GET /api/bets/stats
 * Get portfolio statistics only
 */
betsRouter.get(
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
 * GET /api/bets/market/:marketId
 * Get user bets for a specific market
 */
betsRouter.get(
  '/market/:marketId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const { marketId } = req.params;
    
    const allBets = await wagerService.getUserBets(userId);
    const marketBets = allBets.filter(p => p.marketId === marketId);

    res.json({
      success: true,
      data: marketBets,
      timestamp: Date.now(),
    });
  })
);

/**
 * GET /api/bets/:id
 * Get single bet details
 */
betsRouter.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const bet = await wagerService.getBetById(userId, id);

    res.json({
      success: true,
      data: bet,
      timestamp: Date.now(),
    });
  })
);
