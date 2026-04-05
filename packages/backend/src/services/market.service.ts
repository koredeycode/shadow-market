import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { markets, marketUpvotes, bets, pricePoints } from '../db/schema.js';
import type {
  CreateMarketRequest,
  MarketFilters,
  PaginatedResponse,
  PricePoint,
} from '../types/index.js';
import { generateId } from '../utils/crypto.js';

export class MarketService {
  /**
   * Create a new market
   */
  async createMarket(userId: string, data: CreateMarketRequest) {
    const onchainId = BigInt(data.onchainId || Date.now().toString());
    const slug = await this.generateUniqueSlug(data.question);

    const [market] = await db
      .insert(markets)
      .values({
        id: generateId(),
        onchainId,
        slug,
        txHash: data.txHash,
        question: data.question,
        description: data.description,
        category: data.category as any,
        tags: data.tags || [],
        endTime: data.endTime,
        status: 'OPEN',
        resolutionSource: data.resolutionSource,
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
      conditions.push(eq(markets.category, filters.category as any));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Apply sorting
    if (filters.sortBy === 'volume') {
      query = query.orderBy(desc(markets.totalVolume)) as any;
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
      where: or(
        eq(markets.id, marketId),
        eq(markets.slug, marketId),
        sql`${markets.onchainId}::text = ${marketId}`
      ),
      with: {
        creator: {
          columns: {
            id: true,
            username: true,
            address: true,
            reputation: true,
          },
        },
      },
    });

    return result;
  }

  /**
   * Get single market by Slug
   */
  async getMarketBySlug(slug: string) {
    const result = await db.query.markets.findFirst({
      where: eq(markets.slug, slug),
      with: {
        creator: {
          columns: {
            id: true,
            username: true,
            address: true,
            reputation: true,
          },
        },
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
      .set({ status })
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
   * Get trending markets (based on trending score algorithm)
   */
  async getTrendingMarkets(limit: number = 10) {
    // Calculate trending score if not recently updated
    await this.updateTrendingScores();

    return await db
      .select()
      .from(markets)
      .where(eq(markets.status, 'OPEN'))
      .orderBy(desc(markets.trendingScore), desc(markets.upvotes))
      .limit(limit);
  }

  /**
   * Get newly created markets
   */
  async getNewMarkets(limit: number = 10) {
    return await db
      .select()
      .from(markets)
      .where(eq(markets.status, 'OPEN'))
      .orderBy(desc(markets.createdAt))
      .limit(limit);
  }

  /**
   * Upvote a market
   */
  async upvoteMarket(marketId: string, userId: string) {
    // Check if already upvoted
    const existing = await db
      .select()
      .from(marketUpvotes)
      .where(and(eq(marketUpvotes.marketId, marketId), eq(marketUpvotes.userId, userId)))
      .limit(1);

    if (existing.length > 0) {
      throw new Error('Already upvoted');
    }

    // Insert upvote
    await db.insert(marketUpvotes).values({
      marketId,
      userId,
    });

    // Increment upvote count
    const [updated] = await db
      .update(markets)
      .set({
        upvotes: sql`${markets.upvotes} + 1`,
      })
      .where(eq(markets.id, marketId))
      .returning();

    return updated;
  }

  /**
   * Remove upvote from a market
   */
  async removeUpvote(marketId: string, userId: string) {
    // Delete upvote
    const deleted = await db
      .delete(marketUpvotes)
      .where(and(eq(marketUpvotes.marketId, marketId), eq(marketUpvotes.userId, userId)))
      .returning();

    if (deleted.length === 0) {
      throw new Error('Upvote not found');
    }

    // Decrement upvote count
    const [updated] = await db
      .update(markets)
      .set({
        upvotes: sql`GREATEST(${markets.upvotes} - 1, 0)`,
      })
      .where(eq(markets.id, marketId))
      .returning();

    return updated;
  }

  /**
   * Update trending scores for all active markets
   * Algorithm: score = (volumeChange24h * 0.4) + (upvotesChange24h * 0.3) + (recencyScore * 0.3)
   */
  async updateTrendingScores() {
    const now = new Date();
    // Get all open markets
    const openMarkets = await db.select().from(markets).where(eq(markets.status, 'OPEN'));

    for (const market of openMarkets) {
      // Calculate volume change (simplified - track in separate table for production)
      const volumeChange = parseFloat(market.volumeChange24h);

      // Calculate upvote change (simplified - would need separate tracking table)
      const upvoteChange = market.upvotes;

      // Calculate recency score (0-100, newer = higher)
      const ageInHours = (now.getTime() - market.createdAt.getTime()) / (1000 * 60 * 60);
      const recencyScore = Math.max(0, 100 - ageInHours);

      // Calculate trending score
      const trendingScore = volumeChange * 0.4 + upvoteChange * 30 + recencyScore * 0.3;

      // Update market
      await db
        .update(markets)
        .set({
          trendingScore: trendingScore.toFixed(2),
        })
        .where(eq(markets.id, market.id));
    }
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
      .from(bets)
      .where(eq(bets.marketId, marketId));

    return {
      marketId,
      totalVolume: market.totalVolume,
      totalPositions: Number(positionCount),
      yesPrice: market.yesPrice,
      noPrice: market.noPrice,
      status: market.status,
    };
  }
  /**
   * Generates a unique slug for a given question, handling collisions by appending numeric suffixes.
   */
  private async generateUniqueSlug(question: string): Promise<string> {
    const baseSlug = question
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await db.query.markets.findFirst({
        where: eq(markets.slug, slug),
      });

      if (!existing) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
}
