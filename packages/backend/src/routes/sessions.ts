import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { SessionService } from '../services/session.service.js';
import { asyncHandler } from '../utils/async-handler.js';

export const sessionsRouter = Router();
const sessionService = new SessionService();

// Validation schemas
const authorizeSessionSchema = z.object({
  pairingCode: z.string().min(10).max(12),
  walletAddress: z.string().min(1),
  signature: z.string().min(1),
});

/**
 * POST /api/sessions/create
 * Create a new pending session for the TUI
 */
sessionsRouter.post(
  '/create',
  asyncHandler(async (req, res) => {
    const session = await sessionService.createSession();
    res.status(201).json({
      success: true,
      data: session,
      timestamp: Date.now(),
    });
  })
);

/**
 * POST /api/sessions/authorize
 * Submit signature from Web UI to authorize a pairing code
 */
sessionsRouter.post(
  '/authorize',
  validate({ body: authorizeSessionSchema }),
  asyncHandler(async (req, res) => {
    const { pairingCode, walletAddress, signature } = req.body;
    const session = await sessionService.authorizeSession(pairingCode, walletAddress, signature);
    
    res.json({
      success: true,
      data: session,
      timestamp: Date.now(),
    });
  })
);

/**
 * GET /api/sessions/:pairingCode/status
 * Check pairing status (polling for TUI)
 */
sessionsRouter.get(
  '/:pairingCode/status',
  asyncHandler(async (req, res) => {
    const { pairingCode } = req.params;
    const session = await sessionService.getSessionStatus(pairingCode);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    res.json({
      success: true,
      data: {
        status: session.status,
        walletAddress: session.walletAddress,
        userId: session.userId,
        authorizedAt: session.authorizedAt,
      },
      timestamp: Date.now(),
    });
  })
);
