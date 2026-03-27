/**
 * Frontend Contract Service
 * Uses the API wrapper for clean contract interactions
 * Following BBoard pattern of Context → Manager → API → Contract
 *
 * NOTE: This uses stub implementation until contracts are compiled
 */

import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
// Provider imports will be needed when contract is compiled:
// import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
// import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import {
  UnifiedMarketAPI,
  type DeployedUnifiedMarketAPI,
  type DeployedUnifiedMarketConfig,
} from '../../../api/src/index';

// Configuration from environment
const UNIFIED_CONTRACT_ADDRESS =
  import.meta.env.VITE_UNIFIED_CONTRACT_ADDRESS ||
  'cd9dae0f85be015b6b6c6b4008de30fc0be98d55bbf6b61f0fbda0e359f9aea7';
const INDEXER_URL = import.meta.env.VITE_INDEXER_URL || 'http://localhost:8088/api/v1/graphql';
const INDEXER_WS = import.meta.env.VITE_INDEXER_WS || 'ws://localhost:8088/api/v1/graphql/ws';
const PROOF_SERVER_URL = import.meta.env.VITE_PROOF_SERVER_URL || 'http://localhost:8089';
const NETWORK_ID = import.meta.env.VITE_NETWORK_ID || 'undeployed';

/**
 * Contract manager for the frontend
 * Handles initialization and provides access to contract methods
 */
class ContractManager {
  private api: DeployedUnifiedMarketAPI | null = null;
  private wallet: ConnectedAPI | null = null;

  /**
   * Initialize contract with wallet connection
   */
  async initialize(connectedWallet: ConnectedAPI): Promise<boolean> {
    try {
      this.wallet = connectedWallet;

      // Note: SDK v4 doesn't expose getPrivateStateProvider directly
      // Private state is managed internally by the wallet

      // Create indexer providers (unused in stub mode, but kept for future)
      // const publicDataProvider = indexerPublicDataProvider(INDEXER_URL, INDEXER_WS);
      // const proofProvider = httpClientProofProvider(PROOF_SERVER_URL);

      // Configure API
      const config: DeployedUnifiedMarketConfig = {
        contractAddress: UNIFIED_CONTRACT_ADDRESS,
        networkId: NETWORK_ID,
        indexerUrl: INDEXER_URL,
        indexerWs: INDEXER_WS,
        proofServerUrl: PROOF_SERVER_URL,
        nodeUrl: 'http://localhost:8090',
      };

      // Initialize API
      this.api = new UnifiedMarketAPI(config);

      console.log('✅ Unified Market contract initialized (stub mode):', UNIFIED_CONTRACT_ADDRESS);
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize contract:', error);
      return false;
    }
  }

  /**
   * Check if contract is initialized
   */
  isInitialized(): boolean {
    return this.api !== null && this.wallet !== null;
  }

  /**
   * Place a bet on a pool market
   */
  async placeBet(marketId: string, betAmount: bigint, betOutcome: boolean): Promise<void> {
    if (!this.api || !this.wallet) {
      throw new Error('Contract not initialized');
    }

    try {
      await this.api.placeBet(marketId, betAmount, betOutcome, this.wallet);
      console.log(`✅ Bet placed on market ${marketId}`);
    } catch (error) {
      console.error('❌ Failed to place bet:', error);
      throw error;
    }
  }

  /**
   * Create a new pool market
   */
  async createMarket(
    marketId: string,
    questionHash: Uint8Array,
    resolverAddress: string,
    endTime: bigint
  ): Promise<void> {
    if (!this.api || !this.wallet) {
      throw new Error('Contract not initialized');
    }

    try {
      await this.api.createMarket(marketId, questionHash, resolverAddress, endTime, this.wallet);
      console.log(`✅ Market created: ${marketId}`);
    } catch (error) {
      console.error('❌ Failed to create market:', error);
      throw error;
    }
  }

  /**
   * Lock a market (admin only)
   */
  async lockMarket(marketId: string): Promise<void> {
    if (!this.api || !this.wallet) {
      throw new Error('Contract not initialized');
    }

    try {
      await this.api.lockMarket(marketId, this.wallet);
      console.log(`✅ Market locked: ${marketId}`);
    } catch (error) {
      console.error('❌ Failed to lock market:', error);
      throw error;
    }
  }

  /**
   * Resolve a market (admin/resolver only)
   */
  async resolveMarket(marketId: string, outcome: boolean): Promise<void> {
    if (!this.api || !this.wallet) {
      throw new Error('Contract not initialized');
    }

    try {
      await this.api.resolveMarket(marketId, outcome, this.wallet);
      console.log(`✅ Market resolved: ${marketId}, outcome: ${outcome}`);
    } catch (error) {
      console.error('❌ Failed to resolve market:', error);
      throw error;
    }
  }

  /**
   * Claim pool winnings
   */
  async claimPoolWinnings(marketId: string): Promise<void> {
    if (!this.api || !this.wallet) {
      throw new Error('Contract not initialized');
    }

    try {
      await this.api.claimPoolWinnings(marketId, this.wallet);
      console.log(`✅ Pool winnings claimed for market ${marketId}`);
    } catch (error) {
      console.error('❌ Failed to claim pool winnings:', error);
      throw error;
    }
  }

  /**
   * Create a P2P wager
   */
  async createWager(
    wagerId: string,
    questionHash: Uint8Array,
    makerStake: bigint,
    takerStake: bigint,
    makerPrediction: boolean,
    expiryTime: bigint
  ): Promise<void> {
    if (!this.api || !this.wallet) {
      throw new Error('Contract not initialized');
    }

    try {
      await this.api.createWager(
        wagerId,
        questionHash,
        makerStake,
        takerStake,
        makerPrediction,
        expiryTime,
        this.wallet
      );
      console.log(`✅ Wager created: ${wagerId}`);
    } catch (error) {
      console.error('❌ Failed to create wager:', error);
      throw error;
    }
  }

  /**
   * Accept a P2P wager
   */
  async acceptWager(wagerId: string): Promise<void> {
    if (!this.api || !this.wallet) {
      throw new Error('Contract not initialized');
    }

    try {
      await this.api.acceptWager(wagerId, this.wallet);
      console.log(`✅ Wager accepted: ${wagerId}`);
    } catch (error) {
      console.error('❌ Failed to accept wager:', error);
      throw error;
    }
  }

  /**
   * Resolve a P2P wager
   */
  async resolveWager(wagerId: string, outcome: boolean): Promise<void> {
    if (!this.api || !this.wallet) {
      throw new Error('Contract not initialized');
    }

    try {
      await this.api.resolveWager(wagerId, outcome, this.wallet);
      console.log(`✅ Wager resolved: ${wagerId}, outcome: ${outcome}`);
    } catch (error) {
      console.error('❌ Failed to resolve wager:', error);
      throw error;
    }
  }

  /**
   * Cancel a P2P wager
   */
  async cancelWager(wagerId: string): Promise<void> {
    if (!this.api || !this.wallet) {
      throw new Error('Contract not initialized');
    }

    try {
      await this.api.cancelWager(wagerId, this.wallet);
      console.log(`✅ Wager cancelled: ${wagerId}`);
    } catch (error) {
      console.error('❌ Failed to cancel wager:', error);
      throw error;
    }
  }

  /**
   * Claim wager winnings
   */
  async claimWagerWinnings(wagerId: string): Promise<void> {
    if (!this.api || !this.wallet) {
      throw new Error('Contract not initialized');
    }

    try {
      await this.api.claimWagerWinnings(wagerId, this.wallet);
      console.log(`✅ Wager winnings claimed: ${wagerId}`);
    } catch (error) {
      console.error('❌ Failed to claim wager winnings:', error);
      throw error;
    }
  }

  /**
   * Get current contract state
   */
  async getState(): Promise<any> {
    if (!this.api) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.api.state();
    } catch (error) {
      console.error('❌ Failed to get contract state:', error);
      throw error;
    }
  }

  /**
   * Cleanup and disconnect
   */
  cleanup(): void {
    this.api = null;
    this.wallet = null;
    console.log('🧹 Contract manager cleaned up');
  }
}

// Export singleton instance
export const contractManager = new ContractManager();
export default contractManager;
