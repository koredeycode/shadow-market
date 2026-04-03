import { eq } from 'drizzle-orm';
import logger from '../utils/logger.js';
import { broadcastToMarket, broadcastToUser } from '../websocket.js';
import { db } from './client.js';
import { markets, positions } from './schema.js';

/**
 * Background job to sync market data from blockchain
 * In production, this would listen to on-chain events
 */
export async function syncMarketPrices() {
  try {
    // Get all open markets
    const openMarkets = await db.query.markets.findMany({
      where: eq(markets.status, 'OPEN'),
    });

    for (const market of openMarkets) {
      // In production, fetch from contract
      // For now, simulate price updates

      // Broadcast update to subscribed clients
      broadcastToMarket(market.id, 'market:update', {
        yesPrice: market.yesPrice,
        noPrice: market.noPrice,
        totalVolume: market.totalVolume,
      });
    }

    logger.debug('Market prices synced', { count: openMarkets.length });
  } catch (error) {
    logger.error('Market sync failed', { error });
  }
}

/**
 * Update user positions with current prices
 */
export async function updatePositionValues() {
  try {
    // Get all unsettled positions
    const activePositions = await db.query.positions.findMany({
      where: eq(positions.isSettled, false),
      with: { market: true },
    });

    for (const position of activePositions) {
      if (position.market.status === 'OPEN') {
        // Calculate current value based on market price
        // In production, decrypt and calculate actual values

        // Notify user of position update
        broadcastToUser(position.userId, 'position:update', {
          marketId: position.marketId,
          value: '0', // Calculate from market price
          profitLoss: '0', // Calculate P&L
        });
      }
    }

    logger.debug('Position values updated', { count: activePositions.length });
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

  // Update position values every 30 seconds
  setInterval(updatePositionValues, 30000);

  logger.info('Background jobs started', {
    syncInterval: '10s',
    positionUpdateInterval: '30s',
  });
}
