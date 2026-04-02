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
import { useWalletStore } from '../store/wallet.store';
import toast from 'react-hot-toast';
import { showTxSuccessToast } from '../components/common/tx-toast.utils';

/**
 * Contract Manager - Singleton service for contract interactions
 */
class ContractManager {
  private api: ShadowMarketAPI | null = null;
  private stateSubscription: Subscription | null = null;

  /**
   * Helper to log with high-resolution timestamps
   */
  private log(message: string, ...args: any[]) {
    const now = new Date();
    const timestamp = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}]`;
    console.log(`${timestamp} DEBUG: ${message}`, ...args);
  }

  /**
   * Initialize the contract connection
   */
  async initialize(wallet: ConnectedAPI, config: DeployedShadowMarketConfig): Promise<boolean> {
    const initToast = toast.loading('Establishing secure terminal connection...');

    try {
      this.api = await ShadowMarketAPI.connect(wallet, config);

      this.stateSubscription = this.api.state$.subscribe((state: any) => {
        const store = useContractStore.getState();
        store.setProtocolInitialized(state.isInitialized);
        store.setStats(state.marketCount, state.wagerCount);
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
      this.log('Waiting for state update synchronization...');
      const timeout = setTimeout(() => {
        subscription.unsubscribe();
        console.error('DEBUG: State update synchronization timed out after', timeoutMs, 'ms');
        reject(new Error('State update synchronization timed out'));
      }, timeoutMs);

      const subscription = api.state$.subscribe((state) => {
        this.log('State update received, checking predicate...', state);
        if (predicate(state)) {
          this.log('Predicate met. Finalizing.');
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
  private async executeTx<T = string>(
    txOperation: () => Promise<T>,
    loadingMsg: string,
    successMsg: string,
    waitForUpdate?: (state: any) => boolean
  ): Promise<T> {
    if (!this.api) throw new Error('Contract not initialized');
    
    // Set transacting status to pause balance polling
    useWalletStore.getState().setTransacting(true);
    
    const activeToasts: string[] = [];
    const cleanup = () => {
      // Start 6s countdown for all milestone toasts
      activeToasts.forEach(id => {
        setTimeout(() => toast.dismiss(id), 6000);
      });
    };

    // 1. Step 1: Authorization
    const authToastId = toast.loading('Waiting for wallet authorization...', { duration: Infinity });
    activeToasts.push(authToastId);
    this.log(`Step 1 initialized: ${authToastId}`);
    
    try {
      // 2. Step 2: Transmission (Processing)
      const promise = txOperation();
      
      // Delay-stack: Create new processing toast and let auth toast linger indefinitely
      const processingToastId = toast.loading(loadingMsg, { duration: Infinity });
      activeToasts.push(processingToastId);
      toast.success('Wallet Authorized', { id: authToastId, duration: Infinity });
      this.log(`Step 2 initialized: ${processingToastId}`);
      
      const result = await promise;
      
      // 3. Step 3: Finalization
      const finalizationToastId = toast.loading('Validating on-chain finalization...', { duration: Infinity });
      activeToasts.push(finalizationToastId);
      toast.success('Proof transmitted successfully', { id: processingToastId, duration: Infinity });
      this.log(`Step 3 initialized: ${finalizationToastId}`);

      if (waitForUpdate) {
        await this.waitForStateUpdate(waitForUpdate);
      } else {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      // 4. Step 4: Rich Success Component
      toast.success('Execution verified and finalized', { id: finalizationToastId, duration: Infinity });
      
      const txHash = typeof result === 'string' ? result : (result as any).txHash;
      showTxSuccessToast(txHash, successMsg);

      cleanup(); // Start the 6s countdown for the trail
      useWalletStore.getState().setTransacting(false);
      return result;
    } catch (error: any) {
      this.log('executeTx failed:', error);
      useWalletStore.getState().setTransacting(false);
      
      const isUserRejection = error.message?.toLowerCase().includes('user rejected') || 
                             error.message?.toLowerCase().includes('declined');
      
      // Mark the last active toast as an error instead of dismissing everything
      const lastId = activeToasts[activeToasts.length - 1];
      if (lastId) {
        toast.error(isUserRejection ? 'Transaction cancelled' : 'Execution failed', { id: lastId, duration: Infinity });
      }

      // Still show the detailed error toast
      toast.error(isUserRejection ? 'Transaction cancelled by user' : `Execution failed: ${error.message}`, { duration: 10000 });
      
      cleanup(); // Even on error, let the trail stay for 6s
      throw error;
    }
  }

  /**
   * Place a bet on a prediction market
   */
  async placeBet(marketId: string, betAmount: bigint, betOutcome: boolean): Promise<{ txHash: string; onchainId: string }> {
    return this.executeTx(
      () => (this.api as any).placeBet(marketId, betAmount, betOutcome),
      'Transmitting bet proof...',
      'Bet finalized on-chain'
    );
  }

  /**
   * Claim winnings from a resolved market
   */
  async claimWinnings(betId: string): Promise<string> {
    return this.executeTx(
      () => (this.api as any).claimWinnings(betId),
      'Verifying winning proof...',
      'Winnings claimed'
    );
  }

  /**
   * Create a new prediction market
   */
  async createMarket(
    question: string,
    resolutionTime: bigint
  ): Promise<{ txHash: string; onchainId: string }> {
    let previousCount = 0n;
    if (this.api) {
        // We'll use the protocol state to wait for marketCount increment
        const sub = this.api.state$.subscribe(s => { previousCount = s.marketCount; });
        sub.unsubscribe();
    }

    return this.executeTx(
      () => (this.api as any).createMarket(question, resolutionTime),
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
      () => (this.api as any).resolveMarket(marketId, outcome),
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
  ): Promise<{ txHash: string; onchainId: string }> {
    let previousCount = 0n;
    if (this.api) {
        const sub = this.api.state$.subscribe(s => { previousCount = s.wagerCount; });
        sub.unsubscribe();
    }

    return this.executeTx(
      () => (this.api as any).createWager(marketId, side, amount, oddsNumerator, oddsDenominator),
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
      () => (this.api as any).acceptWager(wagerId),
      'Accepting wager offer...',
      'Wager matched'
    );
  }

  /**
   * Cancel an open P2P wager
   */
  async cancelWager(wagerId: string): Promise<string> {
    return this.executeTx(
      () => (this.api as any).cancelWager(wagerId),
      'Processing cancellation...',
      'Wager offer withdrawn'
    );
  }

  /**
   * Claim winnings from a resolved P2P wager
   */
  async claimWagerWinnings(wagerId: string): Promise<string> {
    return this.executeTx(
      () => (this.api as any).claimWagerWinnings(wagerId),
      'Finalizing payout...',
      'Payout received'
    );
  }
  
  /**
   * Initialize the contract on-chain (admin only)
   */
  async executeContractInitialize(): Promise<string> {
    return this.executeTx(
      () => (this.api as any).initialize(),
      'Executing initialize() circuit...',
      'Contract initialized on-chain'
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
