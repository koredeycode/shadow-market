/**
 * Contract Service - Manages connection to the Shadow Market smart contract
 *
 * This service provides a singleton interface for interacting with the
 * Midnight smart contract through the ShadowMarketAPI from @shadow-market/api
 */

import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { ShadowMarketAPI, type DeployedShadowMarketConfig } from '@shadow-market/api';
import { Subscription } from 'rxjs';
import { useContractStore } from '../store/contract.store';
import toast, { Toast } from 'react-hot-toast';
import React from 'react';
import { TxToast } from '../components/common/TxToast';

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
    const initToast = toast.loading('Establishing secure terminal connection...');

    try {
      this.api = await ShadowMarketAPI.connect(wallet, config);

      this.stateSubscription = this.api.state$.subscribe((state: any) => {
        useContractStore.getState().setProtocolInitialized(state.isInitialized);
      });

      toast.success('Terminal synchronized', { id: initToast });
      return true;
    } catch (error: any) {
      toast.error(`Synchronization failed: ${error.message}`, { id: initToast });
      return false;
    }
  }

  /**
   * Wait for a specific contract state change
   */
  private async waitForStateUpdate(
    predicate: (state: any) => boolean,
    timeoutMs = 60000
  ): Promise<void> {
    const api = this.api;
    if (!api) return;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        subscription.unsubscribe();
        reject(new Error('State update synchronization timed out'));
      }, timeoutMs);

      const subscription = api.state$.subscribe((state) => {
        if (predicate(state)) {
          clearTimeout(timeout);
          subscription.unsubscribe();
          resolve();
        }
      });
    });
  }

  /**
   * Internal helper to wrap contract calls with toasts
   */
  private async executeTx(
    promise: Promise<string>,
    loadingMsg: string,
    successMsg: string,
    waitForUpdate?: (state: any) => boolean
  ): Promise<string> {
    if (!this.api) throw new Error('Contract not initialized');
    const txToast = toast.loading(loadingMsg);
    try {
      const txHash = await promise;
      
      // Update toast to 'Finalizing' state
      toast.loading('Validating on-chain finalization...', { id: txToast });

      if (waitForUpdate) {
        await this.waitForStateUpdate(waitForUpdate);
      } else {
        // Fallback for actions without explicit state wait
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      // Final success
      toast.success(
        (t: Toast) => React.createElement(TxToast, { t, txHash, successMsg }),
        { id: txToast, duration: 6000 }
      );
      
      return txHash;
    } catch (error: any) {
      toast.error(`Execution failed: ${error.message}`, { id: txToast });
      throw error;
    }
  }

  /**
   * Place a bet on a prediction market
   */
  async placeBet(marketId: string, betAmount: bigint, betOutcome: boolean): Promise<string> {
    return this.executeTx(
      this.api!.placeBet(marketId, betAmount, betOutcome),
      'Transmitting bet proof...',
      'Bet finalized on-chain'
    );
  }

  /**
   * Claim winnings from a resolved market
   */
  async claimWinnings(betId: string): Promise<string> {
    return this.executeTx(
      this.api!.claimWinnings(betId),
      'Verifying winning proof...',
      'Winnings claimed'
    );
  }

  /**
   * Create a new prediction market
   */
  async createMarket(
    question: string,
    resolutionTime: bigint,
    initialLiquidity: bigint,
    oracleAddress: string
  ): Promise<string> {
    let previousCount = 0n;
    if (this.api) {
        // We'll use the protocol state to wait for marketCount increment
        const sub = this.api.state$.subscribe(s => { previousCount = s.marketCount; });
        sub.unsubscribe();
    }

    return this.executeTx(
      this.api!.createMarket(question, resolutionTime, initialLiquidity, oracleAddress),
      'Generating market circuit...',
      'Market deployed successfully',
      (state) => state.marketCount > previousCount
    );
  }

  /**
   * Resolve a market with an outcome
   */
  async resolveMarket(marketId: string, outcome: boolean): Promise<string> {
    return this.executeTx(
      this.api!.resolveMarket(marketId, outcome),
      'Transmitting resolution proof...',
      'Market resolved'
    );
  }

  /**
   * Create a new P2P wager
   */
  async createWager(
    marketId: string,
    side: boolean,
    amount: bigint,
    oddsNumerator: bigint,
    oddsDenominator: bigint
  ): Promise<string> {
    let previousCount = 0n;
    if (this.api) {
        const sub = this.api.state$.subscribe(s => { previousCount = s.wagerCount; });
        sub.unsubscribe();
    }

    return this.executeTx(
      this.api!.createWager(marketId, side, amount, oddsNumerator, oddsDenominator),
      'Publishing P2P wager...',
      'Wager offering active',
      (state) => state.wagerCount > previousCount
    );
  }

  /**
   * Accept an existing P2P wager
   */
  async acceptWager(wagerId: string): Promise<string> {
    return this.executeTx(
      this.api!.acceptWager(wagerId),
      'Accepting wager offer...',
      'Wager matched'
    );
  }

  /**
   * Cancel an open P2P wager
   */
  async cancelWager(wagerId: string): Promise<string> {
    return this.executeTx(
      this.api!.cancelWager(wagerId),
      'Processing cancellation...',
      'Wager offer withdrawn'
    );
  }

  /**
   * Claim winnings from a resolved P2P wager
   */
  async claimWagerWinnings(wagerId: string): Promise<string> {
    return this.executeTx(
      this.api!.claimWagerWinnings(wagerId),
      'Finalizing payout...',
      'Payout received'
    );
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
