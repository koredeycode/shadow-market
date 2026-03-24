import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { markets, positions, pricePoints } from '../db/schema';
import type { CreateMarketRequest, MarketFilters, PaginatedResponse, PricePoint } from '../types';
import { generateId } from '../utils/crypto';

export class MarketService {
  /**
   * Create a new market
   */
  async createMarket(userId: string, data: CreateMarketRequest) {
    const marketId = generateId();
    const onchainId = Date.now().toString(); // Temporary - will be from contract

    const [market] = await db
      .insert(markets)
      .values({
        id: marketId,
        onchainId,
        contractAddress: '0x' + generateId(20), // Temporary
        question: data.question,
        description: data.description,
        marketType: data.marketType,
        category: data.category,
        tags: data.tags || [],
        endTime: data.endTime,
        status: 'PENDING',
        resolutionSource: data.resolutionSource,
        minBet: data.minBet,
        maxBet: data.maxBet,
        creatorId: userId,
      })
      .returning();

    return market;
  }

  /**
   * Get all markets with filters
   */
  async getMarkets(
    filters: MarketFilters
  ): Promise<PaginatedResponse<typeof markets.$inferSelect>> {
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    let query = db.select().from(markets);

    // Apply filters
    const conditions = [];

    if (filters.status) {
      conditions.push(eq(markets.status, filters.status));
    }

    if (filters.category) {
      conditions.push(eq(markets.category, filters.category));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Apply sorting
    if (filters.sortBy === 'volume') {
      query = query.orderBy(desc(markets.totalVolume)) as any;
    } else if (filters.sortBy === 'liquidity') {
      query = query.orderBy(desc(markets.totalLiquidity)) as any;
    } else if (filters.sortBy === 'ending_soon') {
      query = query.orderBy(markets.endTime) as any;
    } else {
      query = query.orderBy(desc(markets.createdAt)) as any;
    }

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(markets)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Apply pagination
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
   * Get single market by ID
   */
  async getMarketById(marketId: string) {
    const result = await db.query.markets.findFirst({
      where: eq(markets.id, marketId),
      with: {
        creator: {
          columns: {
            id: true,
            username: true,
            address: true,
            reputation: true,
          },
        },
        liquidityPool: true,
      },
    });

    return result;
  }

  /**
   * Update market status
   */
  async updateMarketStatus(marketId: string, status: typeof markets.$inferSelect.status) {
    const [updated] = await db
      .update(markets)
      .set({ status, updatedAt: new Date() })
      .where(eq(markets.id, marketId))
      .returning();

    return updated;
  }

  /**
   * Resolve market with outcome
   */
  async resolveMarket(marketId: string, outcome: number) {
    const [updated] = await db
      .update(markets)
      .set({
        status: 'RESOLVED',
        outcome,
        resolvedAt: new Date(),
      })
      .where(eq(markets.id, marketId))
      .returning();

    return updated;
  }

  /**
   * Record price point for charting
   */
  async recordPricePoint(marketId: string, yesPrice: string, noPrice: string, volume: string) {
    await db.insert(pricePoints).values({
      id: generateId(),
      marketId,
      yesPrice,
      noPrice,
      volume,
    });
  }

  /**
   * Get price history for market
   */
  async getPriceHistory(
    marketId: string,
    timeRange: '1h' | '24h' | '7d' | '30d' | 'all' = '24h'
  ): Promise<PricePoint[]> {
    const now = new Date();
    let since: Date;

    switch (timeRange) {
      case '1h':
        since = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        since = new Date(0);
    }

    const points = await db
      .select()
      .from(pricePoints)
      .where(and(eq(pricePoints.marketId, marketId), sql`${pricePoints.timestamp} >= ${since}`))
      .orderBy(pricePoints.timestamp);

    return points.map(point => ({
      timestamp: point.timestamp.getTime(),
      yesPrice: point.yesPrice,
      noPrice: point.noPrice,
      volume: point.volume,
    }));
  }

  /**
   * Get trending markets (most volume in last 24h)
   */
  async getTrendingMarkets(limit: number = 10) {
    return await db
      .select()
      .from(markets)
      .where(eq(markets.status, 'OPEN'))
      .orderBy(desc(markets.totalVolume))
      .limit(limit);
  }

  /**
   * Search markets by question
   */
  async searchMarkets(query: string, limit: number = 10) {
    return await db
      .select()
      .from(markets)
      .where(or(ilike(markets.question, `%${query}%`), ilike(markets.description, `%${query}%`)))
      .limit(limit);
  }

  /**
   * Get market statistics
   */
  async getMarketStats(marketId: string) {
    const market = await this.getMarketById(marketId);
    if (!market) throw new Error('Market not found');

    // Get position count
    const [{ count: positionCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(positions)
      .where(eq(positions.marketId, marketId));

    return {
      marketId,
      totalVolume: market.totalVolume,
      totalLiquidity: market.totalLiquidity,
      totalPositions: Number(positionCount),
      yesPrice: market.yesPrice,
      noPrice: market.noPrice,
      status: market.status,
    };
  }
}
