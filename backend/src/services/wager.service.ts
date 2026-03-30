import { and, desc, eq, or, sql } from 'drizzle-orm';
import { config } from '../config.js';
import { db } from '../db/client.js';
import { markets, positions, users, wagers } from '../db/schema.js';
import type {
  CreateP2PWagerRequest,
  DecryptedPosition,
  PlaceBetRequest,
  PortfolioStats,
} from '../types/index.js';
import { decrypt, encrypt, generateId } from '../utils/crypto.js';

export class WagerService {
  /**
   * Place a bet on a market (AMM-based)
   */
  async placeBet(userId: string, data: PlaceBetRequest) {
    const positionId = generateId();

    // Get market
    let market = await db.query.markets.findFirst({
      where: eq(markets.id, data.marketId),
    });

    // Fallback to onchainId for scripts/integration
    if (!market) {
      market = await db.query.markets.findFirst({
        where: eq(markets.onchainId, data.marketId),
      });
    }

    if (!market) throw new Error('Market not found');
    if (market.status !== 'OPEN') throw new Error('Market not open');

    // Encrypt position data for privacy
    const amountEncrypted = encrypt(data.amount, config.encryptionKey);
    const sideEncrypted = encrypt(data.side, config.encryptionKey);
    const nonceEncrypted = encrypt(generateId(8), config.encryptionKey);

    // Generate commitment (hash of amount + side + nonce)
    const commitmentInput = `${data.amount}:${data.side}:${nonceEncrypted}`;
    const commitment = require('crypto').createHash('sha256').update(commitmentInput).digest('hex');

    // Determine entry price
    const entryPrice = data.side === 'yes' ? market.yesPrice : market.noPrice;

    // Create position
    const [position] = await db
      .insert(positions)
      .values({
        id: positionId,
        userId,
        marketId: data.marketId,
        amountEncrypted,
        sideEncrypted,
        nonceEncrypted,
        commitment,
        entryPrice,
      })
      .returning();

    // Update market stats (in real app, would come from contract)
    await db
      .update(markets)
      .set({
        totalVolume: sql`${markets.totalVolume} + ${data.amount}`,
        totalPositions: sql`${markets.totalPositions} + 1`,
      })
      .where(eq(markets.id, data.marketId));

    return position;
  }

  /**
   * Create P2P wager offer
   */
  async createP2PWager(userId: string, data: CreateP2PWagerRequest) {
    const wagerId = generateId();
    const onchainId = Date.now().toString(); // Temp - will be from contract

    const expiresAt = new Date(Date.now() + data.duration * 1000);

    // Get market
    let market = await db.query.markets.findFirst({
      where: eq(markets.id, data.marketId),
    });

    // Fallback to onchainId
    if (!market) {
      market = await db.query.markets.findFirst({
        where: eq(markets.onchainId, data.marketId),
      });
    }

    if (!market) throw new Error('Market not found');

    const [wager] = await db
      .insert(wagers)
      .values({
        id: wagerId,
        onchainId,
        creatorId: userId,
        marketId: market.id, // Use correct internal ID
        amount: data.amount,
        odds: data.odds,
        creatorSide: data.side,
        status: 'OPEN',
        expiresAt,
      })
      .returning();

    return wager;
  }

  /**
   * Accept P2P wager
   */
  async acceptP2PWager(userId: string, wagerId: string) {
    const wager = await db.query.wagers.findFirst({
      where: eq(wagers.id, wagerId),
    });

    if (!wager) throw new Error('Wager not found');
    if (wager.status !== 'OPEN') throw new Error('Wager not open');
    if (wager.creatorId === userId) throw new Error('Cannot accept own wager');
    if (new Date() > wager.expiresAt) throw new Error('Wager expired');

    const [updated] = await db
      .update(wagers)
      .set({
        takerId: userId,
        status: 'MATCHED',
        matchedAt: new Date(),
      })
      .where(eq(wagers.id, wagerId))
      .returning();

    return updated;
  }

  /**
   * Cancel open wager
   */
  async cancelWager(userId: string, wagerId: string) {
    const wager = await db.query.wagers.findFirst({
      where: eq(wagers.id, wagerId),
    });

    if (!wager) throw new Error('Wager not found');
    if (wager.creatorId !== userId) throw new Error('Not wager creator');
    if (wager.status !== 'OPEN') throw new Error('Wager not open');

    const [updated] = await db
      .update(wagers)
      .set({ status: 'CANCELLED' })
      .where(eq(wagers.id, wagerId))
      .returning();

    return updated;
  }

  /**
   * Get user's positions (decrypted for privacy)
   */
  async getUserPositions(userId: string): Promise<DecryptedPosition[]> {
    const userPositions = await db.query.positions.findMany({
      where: eq(positions.userId, userId),
      with: {
        market: true,
      },
    });

    return userPositions.map(pos => {
      // Decrypt private data
      const amount = decrypt(pos.amountEncrypted, config.encryptionKey);
      const side = decrypt(pos.sideEncrypted, config.encryptionKey);

      // Calculate current value and P&L
      const currentPrice = side === 'yes' ? pos.market.yesPrice : pos.market.noPrice;
      const entryPrice = pos.entryPrice;
      const amountNum = parseFloat(amount);

      const currentValue = (amountNum * parseFloat(currentPrice)).toString();
      const profitLoss = (
        amountNum *
        (parseFloat(currentPrice) - parseFloat(entryPrice))
      ).toString();

      return {
        id: pos.id,
        marketId: pos.marketId,
        amount,
        side: side as 'yes' | 'no',
        entryPrice: pos.entryPrice,
        currentValue,
        profitLoss,
        isSettled: pos.isSettled,
      };
    });
  }

  /**
   * Get user's wagers
   */
  async getUserWagers(userId: string) {
    const userWagers = await db.query.wagers.findMany({
      where: or(eq(wagers.creatorId, userId), eq(wagers.takerId, userId)),
      with: {
        market: true,
        creator: {
          columns: { id: true, username: true, address: true },
        },
        taker: {
          columns: { id: true, username: true, address: true },
        },
      },
      orderBy: [desc(wagers.createdAt)],
    });

    return {
      active: userWagers.filter(w => w.status === 'OPEN' || w.status === 'MATCHED'),
      completed: userWagers.filter(w => w.status === 'RESOLVED'),
      cancelled: userWagers.filter(w => w.status === 'CANCELLED'),
    };
  }

  /**
   * Get portfolio statistics
   */
  async getPortfolioStats(userId: string): Promise<PortfolioStats> {
    const userPositions = await this.getUserPositions(userId);

    const totalValue = userPositions.reduce((sum, pos) => sum + parseFloat(pos.currentValue), 0);

    const totalProfitLoss = userPositions.reduce((sum, pos) => sum + parseFloat(pos.profitLoss), 0);

    const settledPositions = userPositions.filter(p => p.isSettled);
    const wonPositions = settledPositions.filter(p => parseFloat(p.profitLoss) > 0);
    const winRate = settledPositions.length > 0 ? wonPositions.length / settledPositions.length : 0;

    // Get user data
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    return {
      totalValue: totalValue.toString(),
      totalProfitLoss: totalProfitLoss.toString(),
      winRate,
      activePositions: userPositions.filter(p => !p.isSettled).length,
      totalBets: userPositions.length,
      totalVolume: user?.totalVolume || '0',
    };
  }

  /**
   * Claim winnings for a settled position
   */
  async claimWinnings(userId: string, positionId: string) {
    const position = await db.query.positions.findFirst({
      where: and(eq(positions.id, positionId), eq(positions.userId, userId)),
      with: { market: true },
    });

    if (!position) throw new Error('Position not found');
    if (position.isSettled) throw new Error('Already claimed');
    if (position.market.status !== 'RESOLVED') {
      throw new Error('Market not resolved');
    }

    // Decrypt position data
    const amount = decrypt(position.amountEncrypted, config.encryptionKey);
    const side = decrypt(position.sideEncrypted, config.encryptionKey);

    // Check if user won
    const outcome = position.market.outcome;
    const won = (outcome === 1 && side === 'yes') || (outcome === 0 && side === 'no');

    const payout = won ? parseFloat(amount) * 2 : 0; // Simplified - would calculate from AMM
    const profitLoss = payout - parseFloat(amount);

    // Update position
    const [updated] = await db
      .update(positions)
      .set({
        isSettled: true,
        settledAt: new Date(),
        payout: payout.toString(),
        profitLoss: profitLoss.toString(),
      })
      .where(eq(positions.id, positionId))
      .returning();

    // Update user stats
    await db
      .update(users)
      .set({
        totalProfitLoss: sql`${users.totalProfitLoss} + ${profitLoss}`,
      })
      .where(eq(users.id, userId));

    return updated;
  }

  /**
   * Get open wagers for a market
   */
  async getMarketWagers(marketId: string) {
    return await db.query.wagers.findMany({
      where: and(eq(wagers.marketId, marketId), eq(wagers.status, 'OPEN')),
      with: {
        creator: {
          columns: { id: true, username: true, reputation: true },
        },
      },
      orderBy: [desc(wagers.createdAt)],
    });
  }
}
