import logger from '../utils/logger.js';

// Contract service stub - awaiting contract compilation and SDK v4 integration
// The unified contract integration will be implemented after:
// 1. Contract is compiled (pnpm contracts:compile)
// 2. API package wrapper is completed
// 3. Backend wallet integration is set up

/**
 * Unified prediction market contract service for backend admin operations
 *
 * NOTE: This is a stub implementation. To enable:
 * - Compile contracts: pnpm contracts:compile
 * - Complete API wrapper in api/src/index.ts
 * - Set up admin wallet provider
 */
export class UnifiedContractService {
  constructor() {
    logger.warn('Contract service in STUB mode - awaiting contract compilation');
  }

  /**
   * Initialize contract connection
   */
  async initialize() {
    logger.info('Contract service stub initialized');
    // Will use api package once contract is compiled
  }

  /**
   * Lock a market (admin only)
   */
  async lockMarket(marketId: string): Promise<void> {
    logger.debug('Contract stub method called', { method: 'lockMarket', marketId });
    throw new Error('Contract not compiled. Admin operations use database only.');
  }

  /**
   * Resolve a market with outcome (admin only)
   */
  async resolveMarket(marketId: string, outcome: boolean): Promise<void> {
    logger.debug('Contract stub method called', { method: 'resolveMarket', marketId, outcome });
    throw new Error('Contract not compiled. Admin operations use database only.');
  }

  /**
   * Get ledger state (read-only)
   */
  async getLedgerState(): Promise<any | null> {
    return null;
  }

  /**
   * Get market statistics from contract
   */
  async getMarketStats(marketId: string): Promise<{
    yesTotal: bigint;
    noTotal: bigint;
    betCount: bigint;
  } | null> {
    logger.debug('Contract stub method called', { method: 'getMarketStats', marketId });
    return null;
  }
}

// Export singleton instance
export const unifiedContract = new UnifiedContractService();
