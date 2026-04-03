import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { isAdmin } from '../middleware/is-admin.js';
import { validate } from '../middleware/validate.js';
import { AdminService } from '../services/admin.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { verifyAdminPassword } from '../services/admin-init.service.js';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { config } from '../config.js';

export const adminRouter = Router();
const adminService = new AdminService();

// Admin authentication/elevation route
// This must be placed BEFORE the isAdmin middleware
const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

adminRouter.post(
  '/auth',
  authenticate,
  validate({ body: loginSchema }),
  asyncHandler(async (req: AuthRequest, res) => {
    const { username, password } = req.body;
    
    // 0. Verify address matches ADMIN_ADDRESS if configured
    if (config.adminAddress && req.user!.address !== config.adminAddress) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Elevation only allowed from configured admin wallet',
      });
    }

    // 1. Verify credentials
    const isValid = await verifyAdminPassword(username, password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid admin credentials',
      });
    }

    // 2. Promote current user to admin
    await db
      .update(users)
      .set({ isAdmin: true })
      .where(eq(users.id, req.user!.id));

    res.json({
      success: true,
      message: 'Admin status granted successfully',
      timestamp: Date.now(),
    });
  })
);

// All other admin routes require authentication and admin role
adminRouter.use(authenticate, isAdmin);

/**
 * GET /stats
 * Get platform statistics
 */
adminRouter.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const stats = await adminService.getStats();
    res.json({ success: true, data: stats, timestamp: Date.now() });
  })
);

/**
 * GET /markets
 * Get all markets with admin view
 */
const marketFiltersSchema = z.object({
  status: z.enum(['PENDING', 'OPEN', 'LOCKED', 'RESOLVED', 'CANCELLED']).optional(),
  search: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  verified: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

adminRouter.get(
  '/markets',
  validate({ query: marketFiltersSchema }),
  asyncHandler(async (req, res) => {
    const filters = req.query;
    const result = await adminService.getAllMarkets(filters);
    res.json({ success: true, data: result, timestamp: Date.now() });
  })
);

/**
 * POST /markets/:id/toggle-featured
 * Toggle market featured status
 */
adminRouter.post(
  '/markets/:id/toggle-featured',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const market = await adminService.toggleMarketFeatured(id, req.user!.id, req.ip);
    res.json({ success: true, data: market, timestamp: Date.now() });
  })
);

/**
 * POST /markets/:id/toggle-verified
 * Toggle market verified status
 */
adminRouter.post(
  '/markets/:id/toggle-verified',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const market = await adminService.toggleMarketVerified(id, req.user!.id, req.ip);
    res.json({ success: true, data: market, timestamp: Date.now() });
  })
);

/**
 * POST /markets/:id/lock
 * Lock a market
 */
adminRouter.post(
  '/markets/:id/lock',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const market = await adminService.lockMarket(id, req.user!.id, req.ip);
    res.json({ success: true, data: market, timestamp: Date.now() });
  })
);

/**
 * POST /markets/:id/resolve
 * Resolve a market
 */
const resolveMarketSchema = z.object({
  outcome: z.number().int().min(0).max(1),
});

adminRouter.post(
  '/markets/:id/resolve',
  validate({ body: resolveMarketSchema }),
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { outcome } = req.body;
    const market = await adminService.resolveMarket(id, outcome, req.user!.id, req.ip);
    res.json({ success: true, data: market, timestamp: Date.now() });
  })
);

/**
 * POST /markets/:id/cancel
 * Cancel a market
 */
const cancelMarketSchema = z.object({
  reason: z.string().min(10).max(500),
});

adminRouter.post(
  '/markets/:id/cancel',
  validate({ body: cancelMarketSchema }),
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const market = await adminService.cancelMarket(id, reason, req.user!.id, req.ip);
    res.json({ success: true, data: market, timestamp: Date.now() });
  })
);

/**
 * GET /users
 * Get all users
 */
const userFiltersSchema = z.object({
  search: z.string().optional(),
  blocked: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

adminRouter.get(
  '/users',
  validate({ query: userFiltersSchema }),
  asyncHandler(async (req, res) => {
    const filters = req.query;
    const result = await adminService.getAllUsers(filters);
    res.json({ success: true, data: result, timestamp: Date.now() });
  })
);

/**
 * POST /users/:id/toggle-block
 * Block/unblock a user
 */
adminRouter.post(
  '/users/:id/toggle-block',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const user = await adminService.toggleUserBlock(id, req.user!.id, req.ip);
    res.json({ success: true, data: user, timestamp: Date.now() });
  })
);



/**
 * GET /activity-log
 * Get admin activity log
 */
const activityLogSchema = z.object({
  limit: z.coerce.number().int().positive().max(200).optional(),
});

adminRouter.get(
  '/activity-log',
  validate({ query: activityLogSchema }),
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const log = await adminService.getActivityLog(limit);
    res.json({ success: true, data: log, timestamp: Date.now() });
  })
);

/**
 * GET /revenue
 * Get revenue statistics
 */
const revenueStatsSchema = z.object({
  range: z.enum(['24h', '7d', '30d']).default('24h'),
});

adminRouter.get(
  '/revenue',
  validate({ query: revenueStatsSchema }),
  asyncHandler(async (req, res) => {
    const range = (req.query.range as '24h' | '7d' | '30d') || '24h';
    const stats = await adminService.getRevenueStats(range);
    res.json({ success: true, data: stats, timestamp: Date.now() });
  })
);
