import { createHash } from 'node:crypto';
import { and, desc, eq, or, sql } from 'drizzle-orm';
import { config } from '../config.js';
import { db } from '../db/client.js';
import { markets, bets, users, wagers } from '../db/schema.js';
import type {
  CreateP2PWagerRequest,
  DecryptedBet,
  PlaceBetRequest,
  PortfolioStats,
} from '../types/index.js';
import { decrypt, encrypt, generateId } from '../utils/crypto.js';

export class WagerService {
  /**
   * Place a bet on a market (AMM-based)
   */
  async placeBet(userId: string, data: PlaceBetRequest) {
    const betId = generateId();

    // Get market
    let market = await db.query.markets.findFirst({
      where: eq(markets.id, data.marketId),
    });

    // Fallback to onchainId for scripts/integration
    if (!market) {
      // Try parsing marketId as bigint for onchainId lookup
      try {
        const potentialOnchainId = BigInt(data.marketId);
        market = await db.query.markets.findFirst({
          where: eq(markets.onchainId, potentialOnchainId),
        });
      } catch (e) {
        // Not a bigint, skip fallback
      }
    }

    if (!market) throw new Error('Market not found');
    if (market.status !== 'OPEN') throw new Error('Market not open');

    // Encrypt position data for privacy
    const amountEncrypted = encrypt(data.amount, config.encryptionKey);
    const sideEncrypted = encrypt(data.side, config.encryptionKey);
    const nonceEncrypted = encrypt(generateId(8), config.encryptionKey);

    const commitmentInput = `${data.amount}:${data.side}:${nonceEncrypted}`;
    const commitment = createHash('sha256').update(commitmentInput).digest('hex');

    // Determine entry price
    const entryPrice = data.side === 'yes' ? market.yesPrice : market.noPrice;

    // Create bet
    const [bet] = await db
      .insert(bets)
      .values({
        id: betId,
        onchainId: data.onchainId,
        txHash: data.txHash,
        userId,
        marketId: market.id,
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
        totalBets: sql`${markets.totalBets} + 1`,
      })
      .where(eq(markets.id, market.id));

    return bet;
  }

  /**
   * Create P2P wager offer
   */
  async createP2PWager(userId: string, data: CreateP2PWagerRequest) {
    const wagerId = generateId();
    const onchainId = data.onchainId || Date.now().toString(); // Use provided ID or fallback

    const expiresAt = new Date(Date.now() + data.duration * 1000);

    // Get market
    let market = await db.query.markets.findFirst({
      where: eq(markets.id, data.marketId),
    });

    // Fallback to onchainId
    if (!market) {
      try {
        const potentialOnchainId = BigInt(data.marketId);
        market = await db.query.markets.findFirst({
          where: eq(markets.onchainId, potentialOnchainId),
        });
      } catch (e) {
        // Not a bigint
      }
    }

    if (!market) throw new Error('Market not found');

    const [wager] = await db
      .insert(wagers)
      .values({
        id: wagerId,
        onchainId,
        txHash: data.txHash,
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
   * Get user's bets (decrypted for privacy)
   */
  async getUserBets(userId: string): Promise<DecryptedBet[]> {
    const userBets = await db.query.bets.findMany({
      where: eq(bets.userId, userId),
      with: {
        market: true,
        user: {
          columns: { username: true }
        }
      },
    });

    return userBets.map(pos => {
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
        marketSlug: pos.market.slug,
        marketQuestion: pos.market.question,
        amount,
        side: side as 'yes' | 'no',
        entryPrice: pos.entryPrice,
        currentValue,
        profitLoss,
        isSettled: pos.isSettled,
        entryTimestamp: pos.entryTimestamp,
        settledAt: pos.settledAt || undefined,
        payout: pos.payout || undefined,
        username: pos.user?.username || undefined,
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
      completed: userWagers.filter(w => w.status === 'SETTLED'),
      cancelled: userWagers.filter(w => w.status === 'CANCELLED'),
    };
  }

  /**
   * Get full portfolio for a user
   */
  async getFullPortfolio(userId: string): Promise<any> {
    const allBets = await this.getUserBets(userId);
    const stats = await this.getPortfolioStats(userId);

    return {
      activeBets: allBets.filter(p => !p.isSettled),
      settledBets: allBets.filter(p => p.isSettled),
      stats,
    };
  }

  /**
   * Get portfolio statistics
   */
  async getPortfolioStats(userId: string): Promise<PortfolioStats> {
    const userBets = await this.getUserBets(userId);

    const totalValue = userBets.reduce((sum, pos) => sum + parseFloat(pos.currentValue), 0);
    const totalProfitLoss = userBets.reduce((sum, pos) => sum + parseFloat(pos.profitLoss), 0);

    const settledBets = userBets.filter(p => p.isSettled);
    const wonBets = settledBets.filter(p => parseFloat(p.profitLoss) > 0);
    const lostBets = settledBets.filter(p => parseFloat(p.profitLoss) < 0);
    
    const winRate = settledBets.length > 0 ? (wonBets.length / settledBets.length) * 100 : 0;

    const averageBetSize = userBets.length > 0
      ? userBets.reduce((sum, pos) => sum + parseFloat(pos.amount), 0) / userBets.length
      : 0;

    // Get user data
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    return {
      totalValue: totalValue.toString(),
      totalProfitLoss: totalProfitLoss.toString(),
      winRate,
      activeBets: userBets.filter(p => !p.isSettled).length,
      totalBets: userBets.length,
      totalWins: wonBets.length,
      totalLosses: lostBets.length,
      averageBetSize: averageBetSize.toString(),
      totalVolume: user?.totalVolume || '0',
    };
  }

  /**
   * Claim winnings for a settled bet
   */
  async claimWinnings(userId: string, betId: string) {
    const bet = await db.query.bets.findFirst({
      where: and(eq(bets.id, betId), eq(bets.userId, userId)),
      with: { market: true },
    });

    if (!bet) throw new Error('Bet not found');
    if (bet.isSettled) throw new Error('Already claimed');
    if (bet.market.status !== 'RESOLVED') {
      throw new Error('Market not resolved');
    }

    // Decrypt bet data
    const amount = decrypt(bet.amountEncrypted, config.encryptionKey);
    const side = decrypt(bet.sideEncrypted, config.encryptionKey);

    // Check if user won
    const outcome = bet.market.outcome;
    const won = (outcome === 1 && side === 'yes') || (outcome === 0 && side === 'no');

    const payout = won ? parseFloat(amount) * 2 : 0; // Simplified - would calculate from AMM
    const profitLoss = payout - parseFloat(amount);

    // Update bet
    const [updated] = await db
      .update(bets)
      .set({
        isSettled: true,
        settledAt: new Date(),
        payout: payout.toString(),
        profitLoss: profitLoss.toString(),
      })
      .where(eq(bets.id, betId))
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
    const market = await db.query.markets.findFirst({
      where: or(
        eq(markets.id, marketId),
        eq(markets.slug, marketId),
        sql`${markets.onchainId}::text = ${marketId}`
      ),
    });
    
    if (!market) throw new Error('Market not found');
    
    return await db.query.wagers.findMany({
      where: and(eq(wagers.marketId, market.id), eq(wagers.status, 'OPEN')),
      with: {
        creator: {
          columns: { id: true, username: true, reputation: true, address: true },
        },
      },
      orderBy: [desc(wagers.createdAt)],
    });
  }

  /**
   * Get all bets for a specific market
   */
  async getMarketBets(marketId: string) {
    const market = await db.query.markets.findFirst({
      where: or(
        eq(markets.id, marketId),
        eq(markets.slug, marketId),
        sql`${markets.onchainId}::text = ${marketId}`
      ),
    });
    
    if (!market) throw new Error('Market not found');

    const marketBets = await db.query.bets.findMany({
      where: eq(bets.marketId, market.id),
      with: {
        user: {
          columns: { username: true, address: true }
        }
      },
      orderBy: [desc(bets.entryTimestamp)],
    });

    return marketBets.map(pos => {
      const amount = decrypt(pos.amountEncrypted, config.encryptionKey);
      const side = decrypt(pos.sideEncrypted, config.encryptionKey);

      return {
        id: pos.id,
        onchainId: pos.onchainId,
        txHash: pos.txHash,
        amount,
        side: side as 'yes' | 'no',
        entryPrice: pos.entryPrice,
        entryTimestamp: pos.entryTimestamp,
        username: pos.user?.username,
        address: pos.user?.address,
        isSettled: pos.isSettled,
      };
    });
  }

  /**
   * Get thin details for a single bet
   */
  async getBetById(userId: string, betId: string): Promise<DecryptedBet> {
    const bet = await db.query.bets.findFirst({
      where: and(eq(bets.id, betId), eq(bets.userId, userId)),
      with: { 
        market: true,
        user: {
          columns: { username: true }
        }
      },
    });

    if (!bet) throw new Error('Bet not found');

    const amount = decrypt(bet.amountEncrypted, config.encryptionKey);
    const side = decrypt(bet.sideEncrypted, config.encryptionKey);
    const currentValue = (parseFloat(amount) * parseFloat(side === 'yes' ? bet.market.yesPrice : bet.market.noPrice)).toString();
    const profitLoss = (parseFloat(amount) * (parseFloat(side === 'yes' ? bet.market.yesPrice : bet.market.noPrice) - parseFloat(bet.entryPrice))).toString();

    return {
      id: bet.id,
      marketId: bet.marketId,
      marketSlug: bet.market.slug,
      marketQuestion: bet.market.question,
      amount,
      side: side as 'yes' | 'no',
      entryPrice: bet.entryPrice,
      currentValue,
      profitLoss,
      isSettled: bet.isSettled,
      entryTimestamp: bet.entryTimestamp,
      username: bet.user?.username || undefined,
    };
  }

  /**
   * Get single wager details
   */
  async getWagerById(wagerId: string) {
    const wager = await db.query.wagers.findFirst({
      where: or(
        eq(wagers.id, wagerId),
        eq(wagers.onchainId, wagerId)
      ),
      with: {
        market: true,
        creator: {
          columns: { id: true, username: true, address: true },
        },
        taker: {
          columns: { id: true, username: true, address: true },
        },
      },
    });

    if (!wager) throw new Error('Wager not found');
    return wager;
  }

  /**
   * Sync update for a wager after on-chain action (accept/cancel)
   */
  async updateWagerSync(wagerId: string, data: { status: string; takerId?: string; txHash?: string }) {
    const [updated] = await db
      .update(wagers)
      .set({
        status: data.status as any,
        takerId: data.takerId,
        txHash: data.txHash || sql`tx_hash`,
        matchedAt: data.status === 'MATCHED' ? new Date() : sql`matched_at`,
        settledAt: data.status === 'SETTLED' ? new Date() : sql`settled_at`,
      })
      .where(or(eq(wagers.id, wagerId), eq(wagers.onchainId, wagerId)))
      .returning();

    if (!updated) throw new Error('Wager not found');
    return updated;
  }
}
