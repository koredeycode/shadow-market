import { createHash } from 'node:crypto';
import { and, desc, eq, or, sql } from 'drizzle-orm';
import { config } from '../config.js';
import { db } from '../db/client.js';
import { markets, bets, users, wagers, marketStats, pricePoints } from '../db/schema.js';
import type {
  CreateP2PWagerRequest,
  DecryptedBet,
  PlaceBetRequest,
  PortfolioStats,
} from '../types/index.js';
import { decrypt, encrypt, generateId } from '../utils/crypto.js';
import { broadcastToMarket } from '../websocket.js';

export class WagerService {
  /**
   * Place a bet on a market (AMM-based)
   */
  async placeBet(userId: string, data: PlaceBetRequest) {
    const betId = generateId();

    // Use transaction with row-level locking to prevent race conditions
    return await db.transaction(async (tx) => {
      // Step 1: Fetch market with FOR UPDATE to lock row until transaction completes
      let marketResult;
      const marketQuery = tx
        .select()
        .from(markets)
        .where(eq(markets.id, data.marketId));
      
      // Use standard Drizzle Postgres for('update') syntax for row-level locking
      marketResult = await (marketQuery as any).for('update');
      let market = marketResult[0];

      if (!market) {
        // Fallback for non-internal IDs (attempt onchainId lookup)
        try {
          const potentialOnchainId = BigInt(data.marketId);
          const fallbackQuery = tx
            .select()
            .from(markets)
            .where(eq(markets.onchainId, potentialOnchainId));
          
          // Use standard Drizzle Postgres for('update') syntax
          const [fallbackMarket] = await (fallbackQuery as any).for('update');
          
          if (!fallbackMarket) throw new Error('Market not found');
          market = fallbackMarket;
        } catch (e) {
          throw new Error('Market not found');
        }
      }

      if (market && market.status !== 'OPEN') throw new Error('Market not open');
      if (!market) throw new Error('Market not found');

      // Encrypt position data for privacy
      const amountEncrypted = encrypt(data.amount, config.encryptionKey);
      const sideEncrypted = encrypt(data.side, config.encryptionKey);
      const nonceEncrypted = encrypt(generateId(8), config.encryptionKey);

      const commitmentInput = `${data.amount}:${data.side}:${nonceEncrypted}`;
      const commitment = createHash('sha256').update(commitmentInput).digest('hex');

      // Determine entry price (using the price before this bet)
      const entryPrice = data.side === 'yes' ? market.yesPrice : market.noPrice;

      // Create bet record
      const [bet] = await tx
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

      // Calculate new volumes and prices based on the locked row's exact state
      const amountNum = BigInt(data.amount);
      const currentYesVol = BigInt(market.totalYesVolume || '0');
      const currentNoVol = BigInt(market.totalNoVolume || '0');

      let newYesVol = currentYesVol;
      let newNoVol = currentNoVol;

      if (data.side === 'yes') {
        newYesVol += amountNum;
      } else {
        newNoVol += amountNum;
      }

      const totalVol = newYesVol + newNoVol;
      
      const newYesPrice = totalVol > 0n 
        ? (Number(newYesVol) / Number(totalVol)).toFixed(17) 
        : '0.5';
      const newNoPrice = totalVol > 0n 
        ? (Number(newNoVol) / Number(totalVol)).toFixed(17) 
        : '0.5';

      // Update market table within the same transaction
      await tx
        .update(markets)
        .set({
          totalVolume: totalVol.toString(),
          totalYesVolume: newYesVol.toString(),
          totalNoVolume: newNoVol.toString(),
          totalBets: sql`${markets.totalBets} + 1`,
          yesPrice: newYesPrice,
          noPrice: newNoPrice,
        })
        .where(eq(markets.id, market.id));

      // Update market_stats within transaction
      const stats = await tx.query.marketStats.findFirst({
        where: eq(marketStats.marketId, market.id),
      });

      if (stats) {
        // Check if this is a new trader for this market
        const existingBet = await tx.query.bets.findFirst({
          where: and(eq(bets.marketId, market.id), eq(bets.userId, userId), sql`id != ${betId}`),
        });

        await tx
          .update(marketStats)
          .set({
            totalVolume: totalVol.toString(),
            totalBets: sql`${marketStats.totalBets} + 1`,
            uniqueTraders: existingBet ? undefined : sql`${marketStats.uniqueTraders} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(marketStats.id, stats.id));
      } else {
        await tx.insert(marketStats).values({
          id: generateId(),
          marketId: market.id,
          totalVolume: totalVol.toString(),
          totalBets: 1,
          uniqueTraders: 1,
        });
      }

      // Add price point for charting
      await tx.insert(pricePoints).values({
        id: generateId(),
        marketId: market.id,
        yesPrice: newYesPrice,
        noPrice: newNoPrice,
        volume: amountNum.toString(),
        timestamp: new Date(),
      });

      // Broadcast market update (async, after transaction)
      // Note: We fetch the fresh state after the transaction completes or use the calculated values
      setImmediate(async () => {
        try {
          const updatedMarket = await db.query.markets.findFirst({
            where: eq(markets.id, market.id),
            with: {
              creator: {
                columns: { id: true, username: true, address: true, reputation: true },
              },
              stats: true,
            }
          });

          if (updatedMarket) {
            broadcastToMarket(market.id, 'market:updated', {
              ...updatedMarket,
              uniqueTraders: updatedMarket.stats?.uniqueTraders || 0,
            });
          }
        } catch (e) {
          console.error('Failed to broadcast market update:', e);
        }
      });

      return bet;
    });
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
      where: or(
        eq(wagers.id, wagerId),
        eq(wagers.onchainId, wagerId)
      ),
    });

    if (!wager) throw new Error('Wager not found');
    if (wager.status !== 'OPEN') throw new Error('Wager not open');
    // Allow self-matching for testing and flexible wager management
    // if (wager.creatorId === userId) throw new Error('Cannot accept own wager');
    if (new Date() > wager.expiresAt) throw new Error('Wager expired');

    const [updated] = await db
      .update(wagers)
      .set({
        takerId: userId,
        status: 'MATCHED',
        matchedAt: new Date(),
      })
      .where(or(eq(wagers.id, wagerId), eq(wagers.onchainId, wagerId)))
      .returning();

    return updated;
  }

  /**
   * Cancel open wager
   */
  async cancelWager(userId: string, wagerId: string) {
    const wager = await db.query.wagers.findFirst({
      where: or(
        eq(wagers.id, wagerId),
        eq(wagers.onchainId, wagerId)
      ),
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
          marketEndTime: pos.market.endTime.toISOString(),
          marketStatus: pos.market.status,
          amount,
          side: side as 'yes' | 'no',
          entryPrice: pos.entryPrice,
          currentValue,
          profitLoss,
          isSettled: pos.isSettled,
          entryTimestamp: pos.entryTimestamp,
          settledAt: pos.settledAt || undefined,
          payout: pos.payout || undefined,
          txHash: pos.txHash || undefined,
          onchainId: pos.onchainId || undefined,
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
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, address: true, username: true, createdAt: true }
    });
    const allBets = await this.getUserBets(userId);
    const wagers = await this.getUserWagers(userId);
    const stats = await this.getPortfolioStats(userId);

    return {
      ...user,
      bets: allBets,
      activeBets: allBets.filter(b => !b.isSettled),
      settledBets: allBets.filter(b => b.isSettled),
      wagers: wagers.active.concat(wagers.completed),
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

  /**
   * Claim winnings for a settled bet
   */
  async claimWinnings(userId: string, betId: string) {
    const bet = await db.query.bets.findFirst({
      where: and(
        or(eq(bets.id, betId), eq(bets.onchainId, betId)),
        eq(bets.userId, userId)
      ),
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
   * Claim winnings for a settled P2P wager
   */
  async claimWagerWinnings(userId: string, wagerId: string) {
    const wager = await db.query.wagers.findFirst({
      where: and(
        or(eq(wagers.id, wagerId), eq(wagers.onchainId, wagerId)),
        or(eq(wagers.creatorId, userId), eq(wagers.takerId, userId))
      ),
      with: { market: true },
    });

    if (!wager) throw new Error('Wager not found');
    if (wager.status === 'SETTLED') throw new Error('Already claimed');
    if (wager.market.status !== 'RESOLVED') {
      throw new Error('Market not resolved');
    }

    // Check if user won
    const outcome = wager.market.outcome;
    const isCreatorWinner = (outcome === 1 && wager.creatorSide === 'yes') || (outcome === 0 && wager.creatorSide === 'no');
    
    const isWinner = (isCreatorWinner && wager.creatorId === userId) || (!isCreatorWinner && wager.takerId === userId);
    if (!isWinner) throw new Error('User did not win this wager');

    const amountNum = parseFloat(wager.amount);
    const [num, den] = wager.odds;
    const payout = amountNum + (amountNum * (num / den));
    const profitLoss = payout - amountNum;

    // Update wager
    const [updated] = await db
      .update(wagers)
      .set({
        status: 'SETTLED',
        settledAt: new Date(),
        winner: userId,
      })
      .where(eq(wagers.id, wager.id))
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
      marketEndTime: bet.market.endTime.toISOString(),
      marketStatus: bet.market.status,
      amount,
      side: side as 'yes' | 'no',
      entryPrice: bet.entryPrice,
      currentValue,
      profitLoss,
      isSettled: bet.isSettled,
      entryTimestamp: bet.entryTimestamp,
      payout: bet.payout || undefined,
      txHash: bet.txHash || undefined,
      onchainId: bet.onchainId || undefined,
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
