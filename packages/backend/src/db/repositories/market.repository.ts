import { eq, or, sql, and, desc } from 'drizzle-orm';
import { db } from '../client.js';
import { markets, marketStats, pricePoints } from '../schema.js';

export class MarketRepository {
  /**
   * Find market by ID, slug, or onchainId
   */
  async findByIdentifier(id: string) {
    return await db.query.markets.findFirst({
      where: or(
        eq(markets.id, id),
        eq(markets.slug, id),
        sql`${markets.onchainId}::text = ${id}`
      ),
      with: {
        creator: {
          columns: { id: true, username: true, address: true, reputation: true },
        },
        stats: true,
      },
    });
  }

  /**
   * Find many markets with pagination
   */
  async findMany(params: {
    category?: string;
    status?: string;
    limit?: number;
    offset?: number;
    search?: string;
  }) {
    const { limit = 20, offset = 0 } = params;
    
    // Build filters
    const filters = [];
    if (params.category) filters.push(eq(markets.category, params.category as any));
    if (params.status) filters.push(eq(markets.status, params.status as any));
    if (params.search) filters.push(sql`${markets.question} ILIKE ${'%' + params.search + '%'}`);

    const where = filters.length > 0 ? and(...filters) : undefined;

    const [items, total] = await Promise.all([
      db.query.markets.findMany({
        where,
        limit,
        offset,
        orderBy: [desc(markets.createdAt)],
        with: {
          creator: {
            columns: { id: true, username: true, address: true, reputation: true },
          },
          stats: true,
        },
      }),
      db.select({ count: sql<number>`count(*)` })
        .from(markets)
        .where(where)
        .then(res => Number(res[0].count)),
    ]);

    return { items, total, limit, offset };
  }

  /**
   * Get price history for a market
   */
  async getPriceHistory(marketId: string) {
    return await db.query.pricePoints.findMany({
      where: eq(pricePoints.marketId, marketId),
      orderBy: [desc(pricePoints.timestamp)],
      limit: 100,
    });
  }
}

export const marketRepository = new MarketRepository();
