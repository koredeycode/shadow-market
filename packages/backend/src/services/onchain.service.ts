import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { ledger as contractLedger, type Market, type Ledger } from '@shadow-market/contracts';
import { config } from '../config.js';
import logger from '../utils/logger.js';

export class OnChainService {
  private static provider = indexerPublicDataProvider(config.indexerUrl, config.indexerWs);

  /**
   * Fetches the latest ledger state of the Shadow Market contract
   */
  static async getLatestLedger(): Promise<Ledger | null> {
    try {
      const address = config.shadowMarketContractAddress;
      if (!address) {
        throw new Error('MIDNIGHT_SHADOW_MARKET_CONTRACT_ADDRESS not configured');
      }

      // Midnight SDK PublicDataProvider uses contractState for fetching data
      const state = await (this.provider as any).contractState(address, { type: 'latest' });
      if (!state) {
        logger.warn('No on-chain state found for contract', { address });
        return null;
      }

      // Decode the bytes using the ledger codec
      return contractLedger(state.data);
    } catch (error) {
      logger.error('Failed to fetch on-chain ledger', { error });
      return null;
    }
  }

  /**
   * Fetches a specific market by its on-chain ID
   */
  static async getMarket(onchainId: bigint): Promise<Market | null> {
    const ledger = await this.getLatestLedger();
    if (!ledger) return null;

    // Compact Map lookup uses .lookup() in the generated code
    try {
      if (ledger.markets.member(onchainId)) {
        return ledger.markets.lookup(onchainId);
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}
