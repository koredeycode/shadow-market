import { eq } from 'drizzle-orm';
import logger from '../utils/logger.js';
import { broadcastToMarket, broadcastToUser } from '../websocket.js';
import { db } from './client.js';
import { markets, bets } from './schema.js';

import { OnChainService } from '../services/onchain.service.js';

/**
 * Background job to sync market data from blockchain
 */
export async function syncMarketPrices() {
  try {
    // Get latest ledger from Midnight Indexer
    const ledger = await OnChainService.getLatestLedger();
    if (!ledger) return;

    // Get all open markets from local DB
    const openMarkets = await db.query.markets.findMany({
      where: eq(markets.status, 'OPEN'),
    });

    for (const market of openMarkets) {
      // Lookup on-chain state for this market
      const onchainMarket = ledger.markets.get(market.onchainId);
      if (!onchainMarket) continue;

      // Update local DB with on-chain volume and pool totals
      await db.update(markets)
        .set({
          totalVolume: (onchainMarket.yesTotal + onchainMarket.noTotal).toString(),
          yesPrice: onchainMarket.yesTotal > 0n 
            ? (Number(onchainMarket.yesTotal) / Number(onchainMarket.yesTotal + onchainMarket.noTotal)).toFixed(2)
            : '0.50',
          noPrice: onchainMarket.noTotal > 0n
            ? (Number(onchainMarket.noTotal) / Number(onchainMarket.yesTotal + onchainMarket.noTotal)).toFixed(2)
            : '0.50',
          status: onchainMarket.status.toString() as any, // Sync status if it changed
        })
        .where(eq(markets.id, market.id));

      // Broadcast update to subscribed clients
      broadcastToMarket(market.id, 'market:update', {
        yesPrice: market.yesPrice,
        noPrice: market.noPrice,
        totalVolume: market.totalVolume,
      });
    }

    logger.debug('Market prices synced from chain', { count: openMarkets.length });
  } catch (error) {
    logger.error('Market sync failed', { error });
  }
}

/**
 * Update user bets with current prices
 */
export async function updateBetValues() {
  try {
    // Get all unsettled bets
    const activeBets = await db.query.bets.findMany({
      where: eq(bets.isSettled, false),
      with: { market: true },
    });

    for (const bet of activeBets) {
      if (bet.market.status === 'OPEN') {
        // Calculate current value based on market price
        // In production, decrypt and calculate actual values

        // Notify user of bet update
        broadcastToUser(bet.userId, 'bet:update', {
          marketId: bet.marketId,
          value: '0', // Calculate from market price
          profitLoss: '0', // Calculate P&L
        });
      }
    }

    logger.debug('Bet values updated', { count: activeBets.length });
  } catch (error) {
    logger.error('Position update failed', { error });
  }
}

/**
 * Start background jobs
 */
export function startBackgroundJobs() {
  // Sync market prices every 10 seconds
  setInterval(syncMarketPrices, 10000);

  // Update bet values every 30 seconds
  setInterval(updateBetValues, 30000);

  logger.info('Background jobs started', {
    syncInterval: '10s',
    betUpdateInterval: '30s',
  });
}
