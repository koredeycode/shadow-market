import { and, desc, eq, gte, ilike, or, sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { adminActivityLog, markets, bets, users, wagers } from '../db/schema.js';
import { generateId } from '../utils/crypto.js';
import { shadowMarketContract } from './contract.service.js';
import logger from '../utils/logger.js';

export interface AdminStats {
  totalMarkets: number;
  activeMarkets: number;
  lockedMarkets: number;
  resolvedMarkets: number;
  totalVolume: string;
  volume24h: string;
  totalUsers: number;
  activeUsers24h: number;
  totalBets: number;
  totalWagers: number;
  platformFees: string;
  pendingReports: number;
}

export interface AdminMarketFilters {
  status?: string;
  search?: string;
  featured?: boolean;
  verified?: boolean;
  limit?: number;
  offset?: number;
}

export interface AdminUserFilters {
  search?: string;
  blocked?: boolean;
  limit?: number;
  offset?: number;
}

export interface ActivityLogEntry {
  id: string;
  adminId: string;
  adminUsername?: string;
  action: string;
  targetType: string;
  targetId: string;
  details: any;
  ipAddress?: string;
  createdAt: Date;
}

export interface RevenueStats {
  totalRevenue: string;
  period: string;
  breakdown: {
    marketFees: string;
    wagerFees: string;
    liquidityFees: string;
  };
}

export class AdminService {
  /**
   * Get platform statistics for admin dashboard
   */
  async getStats(): Promise<AdminStats> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Count markets by status
    const [marketStats] = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(*) filter (where ${markets.status} = 'OPEN')`,
        locked: sql<number>`count(*) filter (where ${markets.status} = 'LOCKED')`,
        resolved: sql<number>`count(*) filter (where ${markets.status} = 'RESOLVED')`,
        totalVolume: sql<string>`coalesce(sum(${markets.totalVolume}), 0)`,
      })
      .from(markets);

    // Volume in last 24h
    const [volume24hResult] = await db
      .select({
        volume: sql<string>`coalesce(sum(${markets.totalVolume}), 0)`,
      })
      .from(markets)
      .where(gte(markets.createdAt, yesterday));

    // User stats
    const [userStats] = await db
      .select({
        total: sql<number>`count(*)`,
        active24h: sql<number>`count(*) filter (where ${users.updatedAt} >= ${yesterday})`,
      })
      .from(users);

    // Bet stats
    const [betStats] = await db
      .select({
        total: sql<number>`count(*)`,
      })
      .from(bets);

    // Wager stats
    const [wagerStats] = await db
      .select({
        total: sql<number>`count(*)`,
      })
      .from(wagers);

    // Calculate platform fees (2% of total volume)
    const platformFees = (parseFloat(marketStats.totalVolume) * 0.02).toString();

    return {
      totalMarkets: marketStats.total,
      activeMarkets: marketStats.active,
      lockedMarkets: marketStats.locked,
      resolvedMarkets: marketStats.resolved,
      totalVolume: marketStats.totalVolume,
      volume24h: volume24hResult.volume,
      totalUsers: userStats.total,
      activeUsers24h: userStats.active24h,
      totalBets: betStats.total,
      totalWagers: wagerStats.total,
      platformFees,
      pendingReports: 0, // TODO: Implement report system
    };
  }

  /**
   * Get all markets with admin filters
   */
  async getAllMarkets(filters: AdminMarketFilters) {
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    let query = db.select().from(markets);
    const conditions = [];

    if (filters.status) {
      conditions.push(eq(markets.status, filters.status as any));
    }

    if (filters.featured !== undefined) {
      conditions.push(eq(markets.isFeatured, filters.featured));
    }

    if (filters.verified !== undefined) {
      conditions.push(eq(markets.isVerified, filters.verified));
    }

    if (filters.search) {
      conditions.push(ilike(markets.question, `%${filters.search}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(markets.createdAt)) as any;

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(markets)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const items = await query.limit(limit).offset(offset);

    return {
      items,
      total: Number(count),
      page: Math.floor(offset / limit) + 1,
      limit,
      hasMore: offset + items.length < Number(count),
    };
  }

  /**
   * Toggle market featured status
   */
  async toggleMarketFeatured(marketId: string, adminId: string, ipAddress?: string) {
    const market = await db.query.markets.findFirst({
      where: eq(markets.id, marketId),
    });

    if (!market) {
      throw new Error('Market not found');
    }

    const [updated] = await db
      .update(markets)
      .set({
        isFeatured: !market.isFeatured,
      })
      .where(eq(markets.id, marketId))
      .returning();

    await this.logActivity(
      adminId,
      'TOGGLE_FEATURED',
      'market',
      marketId,
      { featured: updated.isFeatured },
      ipAddress
    );

    return updated;
  }

  /**
   * Toggle market verified status
   */
  async toggleMarketVerified(marketId: string, adminId: string, ipAddress?: string) {
    const market = await db.query.markets.findFirst({
      where: eq(markets.id, marketId),
    });

    if (!market) {
      throw new Error('Market not found');
    }

    const [updated] = await db
      .update(markets)
      .set({
        isVerified: !market.isVerified,
      })
      .where(eq(markets.id, marketId))
      .returning();

    await this.logActivity(
      adminId,
      'TOGGLE_VERIFIED',
      'market',
      marketId,
      { verified: updated.isVerified },
      ipAddress
    );

    return updated;
  }

  /**
   * Lock a market (admin action + will call smart contract)
   */
  async lockMarket(marketId: string, adminId: string, ipAddress?: string) {
    // Get market to get onchain ID
    const market = await db.query.markets.findFirst({
      where: eq(markets.id, marketId),
    });

    if (!market) {
      throw new Error('Market not found');
    }

    // Update database first
    const [updated] = await db
      .update(markets)
      .set({
        status: 'LOCKED',
      })
      .where(eq(markets.id, marketId))
      .returning();

    if (!updated) {
      throw new Error('Market not found');
    }

    await this.logActivity(adminId, 'LOCK_MARKET', 'market', marketId, {}, ipAddress);

    // Call smart contract in background (don't block response)
    // Note: In production, admin should have wallet connected
    // This is a simplified version - real implementation needs admin's private state provider
    try {
      // const onchainMarketId = BigInt(market.onchainId);
      // await shadowMarketContract.lockMarket(onchainMarketId, adminPrivateState, adminWallet);
      logger.warn('Contract call not implemented - admin wallet connection required', {
        action: 'lockMarket',
        marketId,
      });
    } catch (error) {
      logger.error('Contract call failed', { action: 'lockMarket', marketId, error });
      // Don't fail the database update if contract call fails
    }

    return updated;
  }

  /**
   * Resolve a market (admin action + will call smart contract)
   */
  async resolveMarket(marketId: string, outcome: number, adminId: string, ipAddress?: string) {
    // Get market to get onchain ID
    const market = await db.query.markets.findFirst({
      where: eq(markets.id, marketId),
    });

    if (!market) {
      throw new Error('Market not found');
    }

    // Update database first
    const [updated] = await db
      .update(markets)
      .set({
        status: 'RESOLVED',
        outcome,
        resolvedAt: new Date(),
      })
      .where(eq(markets.id, marketId))
      .returning();

    if (!updated) {
      throw new Error('Market not found');
    }

    await this.logActivity(adminId, 'RESOLVE_MARKET', 'market', marketId, { outcome }, ipAddress);

    // Call smart contract in background (don't block response)
    // Note: In production, admin should have wallet connected via DAppConnector
    try {
      // const onchainMarketId = BigInt(market.onchainId);
      // const onchainOutcome = BigInt(outcome);
      // await shadowMarketContract.resolveMarket(onchainMarketId, onchainOutcome, adminPrivateState, adminWallet);
      logger.warn('Contract call not implemented - admin wallet connection required', {
        action: 'resolveMarket',
        marketId,
        outcome,
      });
    } catch (error) {
      logger.error('Contract call failed', { action: 'resolveMarket', marketId, outcome, error });
      // Don't fail the database update if contract call fails
    }

    return updated;
  }

  /**
   * Cancel a market
   */
  async cancelMarket(marketId: string, reason: string, adminId: string, ipAddress?: string) {
    const [updated] = await db
      .update(markets)
      .set({
        status: 'CANCELLED',
      })
      .where(eq(markets.id, marketId))
      .returning();

    if (!updated) {
      throw new Error('Market not found');
    }

    await this.logActivity(adminId, 'CANCEL_MARKET', 'market', marketId, { reason }, ipAddress);

    return updated;
  }

  /**
   * Get all users with filters
   */
  async getAllUsers(filters: AdminUserFilters) {
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    let query = db.select().from(users);
    const conditions = [];

    if (filters.blocked !== undefined) {
      conditions.push(eq(users.isBlocked, filters.blocked));
    }

    if (filters.search) {
      conditions.push(
        or(
          ilike(users.username, `%${filters.search}%`),
          ilike(users.address, `%${filters.search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(users.createdAt)) as any;

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const items = await query.limit(limit).offset(offset);

    return {
      items,
      total: Number(count),
      page: Math.floor(offset / limit) + 1,
      limit,
      hasMore: offset + items.length < Number(count),
    };
  }

  /**
   * Toggle user blocked status
   */
  async toggleUserBlock(userId: string, adminId: string, ipAddress?: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new Error('User not found');
    }

    const [updated] = await db
      .update(users)
      .set({
        isBlocked: !user.isBlocked,
      })
      .where(eq(users.id, userId))
      .returning();

    await this.logActivity(
      adminId,
      'TOGGLE_BLOCK',
      'user',
      userId,
      { blocked: updated.isBlocked },
      ipAddress
    );

    return updated;
  }



  /**
   * Get activity log
   */
  async getActivityLog(limit: number = 50): Promise<ActivityLogEntry[]> {
    const logs = await db
      .select({
        id: adminActivityLog.id,
        adminId: adminActivityLog.adminId,
        adminUsername: users.username,
        action: adminActivityLog.action,
        targetType: adminActivityLog.targetType,
        targetId: adminActivityLog.targetId,
        details: adminActivityLog.details,
        ipAddress: adminActivityLog.ipAddress,
        createdAt: adminActivityLog.createdAt,
      })
      .from(adminActivityLog)
      .leftJoin(users, eq(adminActivityLog.adminId, users.id))
      .orderBy(desc(adminActivityLog.createdAt))
      .limit(limit);

    return logs as ActivityLogEntry[];
  }

  /**
   * Get revenue statistics
   */
  async getRevenueStats(range: '24h' | '7d' | '30d'): Promise<RevenueStats> {
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const [result] = await db
      .select({
        volume: sql<string>`coalesce(sum(${markets.totalVolume}), 0)`,
      })
      .from(markets)
      .where(gte(markets.createdAt, startDate));

    const totalRevenue = (parseFloat(result.volume) * 0.02).toString();

    return {
      totalRevenue,
      period: range,
      breakdown: {
        marketFees: totalRevenue,
        wagerFees: '0',
        liquidityFees: '0',
      },
    };
  }

  /**
   * Log admin activity
   */
  private async logActivity(
    adminId: string,
    action: string,
    targetType: string,
    targetId: string,
    details: any,
    ipAddress?: string
  ) {
    await db.insert(adminActivityLog).values({
      id: generateId(),
      adminId,
      action,
      targetType,
      targetId,
      details,
      ipAddress,
    });
  }
}
