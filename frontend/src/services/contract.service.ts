/**
 * Contract Service - Manages connection to the Shadow Market smart contract
 *
 * This service provides a singleton interface for interacting with the
 * Midnight smart contract through the ShadowMarketAPI from @shadow-market/api
 */

import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { ShadowMarketAPI, type DeployedShadowMarketConfig } from '@shadow-market/api';
import { Subscription } from 'rxjs';

/**
 * Contract Manager - Singleton service for contract interactions
 */
class ContractManager {
  private api: ShadowMarketAPI | null = null;
  private stateSubscription: Subscription | null = null;

  /**
   * Initialize the contract connection
   */
  async initialize(wallet: ConnectedAPI, config: DeployedShadowMarketConfig): Promise<boolean> {
    console.log('Initializing contract connection...');

    try {
      // Connect to the contract using the new .connect() pattern
      this.api = await ShadowMarketAPI.connect(wallet, config);

      // Subscribe to state changes
      this.stateSubscription = this.api.state$.subscribe((state: any) => {
        console.log('Contract state updated:', state);
      });

      console.log('Contract initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize contract:', error);
      return false;
    }
  }

  /**
   * Place a bet on a prediction market
   */
  async placeBet(marketId: string, betAmount: bigint, betOutcome: boolean): Promise<void> {
    if (!this.api) {
      throw new Error('Contract not initialized');
    }

    try {
      await this.api.placeBet(marketId, betAmount, betOutcome);
      console.log(`Bet placed: ${betAmount} on ${betOutcome ? 'YES' : 'NO'}`);
    } catch (error) {
      console.error('Failed to place bet:', error);
      throw error;
    }
  }

  /**
   * Claim winnings from a resolved market
   */
  async claimWinnings(betId: string): Promise<void> {
    if (!this.api) {
      throw new Error('Contract not initialized');
    }

    try {
      await this.api.claimWinnings(betId);
      console.log(`Winnings claimed from bet: ${betId}`);
    } catch (error) {
      console.error('Failed to claim winnings:', error);
      throw error;
    }
  }

  /**
   * Create a new prediction market
   */
  async createMarket(
    question: string,
    resolutionTime: bigint,
    initialLiquidity: bigint,
    oracleAddress: string
  ): Promise<void> {
    if (!this.api) {
      throw new Error('Contract not initialized');
    }

    try {
      await this.api.createMarket(question, resolutionTime, initialLiquidity, oracleAddress);
      console.log(`Market created: ${question}`);
    } catch (error) {
      console.error('Failed to create market:', error);
      throw error;
    }
  }

  /**
   * Resolve a market with an outcome
   */
  async resolveMarket(marketId: string, outcome: boolean): Promise<void> {
    if (!this.api) {
      throw new Error('Contract not initialized');
    }

    try {
      await this.api.resolveMarket(marketId, outcome);
      console.log(`Market resolved: ${marketId}, outcome: ${outcome ? 'YES' : 'NO'}`);
    } catch (error) {
      console.error('Failed to resolve market:', error);
      throw error;
    }
  }

  /**
   * Get the deployed contract address
   */
  getContractAddress(): string | undefined {
    return this.api?.deployedContractAddress;
  }

  /**
   * Subscribe to contract state updates
   */
  subscribeToState(callback: (state: any) => void): Subscription | null {
    if (!this.api) {
      console.warn('Cannot subscribe to state: contract not initialized');
      return null;
    }

    return this.api.state$.subscribe(callback);
  }

  /**
   * Check if contract is initialized
   */
  isInitialized(): boolean {
    return this.api !== null;
  }

  /**
   * Cleanup and disconnect
   */
  cleanup(): void {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
      this.stateSubscription = null;
    }

    this.api = null;
    console.log('Contract manager cleaned up');
  }
}

// Export singleton instance
export const contractManager = new ContractManager();
export default contractManager;
