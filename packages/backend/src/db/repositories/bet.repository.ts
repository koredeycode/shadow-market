import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../client.js';
import { bets } from '../schema.js';

export class BetRepository {
  /**
   * Find bet by ID or onchainId
   */
  async findById(betId: string) {
    return await db.query.bets.findFirst({
      where: or(
        eq(bets.id, betId),
        eq(bets.onchainId, betId)
      ),
      with: {
        market: true,
        user: true
      }
    });
  }

  /**
   * Find bets for a user with pagination
   */
  async findByUser(userId: string, limit = 20, offset = 0) {
    const where = eq(bets.userId, userId);
    
    const [items, total] = await Promise.all([
      db.query.bets.findMany({
        where,
        limit,
        offset,
        orderBy: [desc(bets.entryTimestamp)],
        with: {
          market: true
        }
      }),
      db.select({ count: sql<number>`count(*)` })
        .from(bets)
        .where(where)
        .then(res => Number(res[0].count)),
    ]);

    return { items, total, limit, offset };
  }

  /**
   * Find bets for a market
   */
  async findByMarket(marketId: string, limit = 50) {
    return await db.query.bets.findMany({
      where: eq(bets.marketId, marketId),
      limit,
      orderBy: [desc(bets.entryTimestamp)],
      with: {
        user: {
          columns: { username: true, address: true }
        }
      }
    });
  }
}

import { or } from 'drizzle-orm';
export const betRepository = new BetRepository();
