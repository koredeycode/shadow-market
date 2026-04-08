/**
 * Contract Service - Manages connection to the Shadow Market smart contract
 *
 * This service provides a singleton interface for interacting with the
 * Midnight smart contract through the ShadowMarketAPI from @shadow-market/api
 */

import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { ShadowMarketAPI, type DeployedShadowMarketConfig } from '@shadow-market/api';
import toast from 'react-hot-toast';
import { Subscription, from } from 'rxjs';
import { showTxSuccessToast } from '../components/common/tx-toast.utils';
import { useContractStore } from '../store/contract.store';
import { useWalletStore } from '../store/wallet.store';

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

      this.stateSubscription = from(this.api.state$).subscribe((state: any) => {
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
   * Verify wallet is ready and synced before transaction
   */
  private async verifyWalletReadiness(): Promise<void> {
    const walletStore = useWalletStore.getState();
    const dustBalance = Number(walletStore.dustBalance || '0');
    
    this.log(`Verifying wallet readiness... Dust: ${dustBalance}`);
    
    if (dustBalance === 0) {
      this.log('Dust balance is 0. Attempting programmatic sync...');
      const syncToast = toast.loading('Wallet out of sync. Inducing synchronization...');
      
      try {
        // Attempt various sync methods available in different versions of the connector
        const wallet = walletStore.provider;
        if (wallet) {
          if (typeof wallet.sync === 'function') await wallet.sync();
          if (typeof wallet.getConnectionStatus === 'function') await wallet.getConnectionStatus();
        }
        
        // Wait a moment for sync to propagate
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Final check after sync attempt
        const updatedDust = Number(useWalletStore.getState().dustBalance || '0');
        if (updatedDust === 0) {
          toast.error('Wallet balance is 0 or out of sync. Please sync manually in Lace.', { id: syncToast });
          throw new Error('Wallet synchronization required');
        }
        toast.success('Wallet synchronized', { id: syncToast });
      } catch (e: any) {
        toast.dismiss(syncToast);
        throw e;
      }
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
      let sub: any;
      const timeout = setTimeout(() => {
        if (sub) sub.unsubscribe();
        console.error('DEBUG: State update synchronization timed out after', timeoutMs, 'ms');
        reject(new Error('State update synchronization timed out'));
      }, timeoutMs);

      sub = api.state$.subscribe((state) => {
        this.log('State update received, checking predicate...', state);
        if (predicate(state)) {
          this.log('Predicate met. Finalizing.');
          clearTimeout(timeout);
          if (sub) sub.unsubscribe();
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
    successMsg: string,
    waitForUpdate?: (state: any) => boolean
  ): Promise<T> {
    if (!this.api) throw new Error('Contract not initialized');
    
    // Set transacting status to pause balance polling
    useWalletStore.getState().setTransacting(true);
    
    const activeToasts: string[] = [];
    const cleanup = () => {
      activeToasts.forEach(id => {
        setTimeout(() => toast.dismiss(id), 6000);
      });
    };

    try {
      // 0. Pre-Flight: Sync Check
      await this.verifyWalletReadiness();

      // 1. Step 1: Authorization
      const progressToastId = toast.loading('Waiting for wallet authorization... Check for popup', { duration: Infinity });
      activeToasts.push(progressToastId);
      this.log('Step 1: Authorization');
      
      // Set up status listener for granular progress
      let balancingStartTime = 0;
      this.api.setStatusCallback((status: any, data?: any) => {
        this.log(`Milestone reached: ${status}`, data);
        switch (status) {
          case 'CLEANING':
            toast.loading('Cleaning transaction state...', { id: progressToastId });
            break;
          case 'SERIALIZING':
            toast.loading('Serializing circuit parameters...', { id: progressToastId });
            break;
          case 'BALANCING_START':
            balancingStartTime = performance.now();
            toast.loading('Balancing transaction... (Check for final wallet approval)', { id: progressToastId });
            break;
          case 'BALANCING_END':
            const duration = data?.duration || ((performance.now() - balancingStartTime) / 1000).toFixed(1);
            toast.loading(`Balancing complete (${duration}s)`, { id: progressToastId });
            break;
        }
      });

      const result = await txOperation();
      
      // 3. Step 3: Submission & Finalization
      toast.loading('Submission of transaction...', { id: progressToastId });
      this.log('Step 3: Submission');

      if (waitForUpdate) {
        await this.waitForStateUpdate(waitForUpdate);
      } else {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      // 4. Step 4: Success
      toast.success('Transaction Confirmed', { id: progressToastId });
      
      showTxSuccessToast(successMsg);

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
      'Bet finalized on-chain'
    );
  }

  /**
   * Claim winnings from a resolved market
   */
  async claimWinnings(betId: string): Promise<string> {
    return this.executeTx(
      () => (this.api as any).claimWinnings(betId),
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
        const sub = (this.api as any).state$.subscribe((s: any) => { previousCount = s.marketCount; });
        sub.unsubscribe();
    }

    return this.executeTx(
      () => (this.api as any).createMarket(question, resolutionTime),
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
        const sub = (this.api as any).state$.subscribe((s: any) => { previousCount = s.wagerCount; });
        sub.unsubscribe();
    }

    return this.executeTx(
      () => (this.api as any).createWager(marketId, side, amount, oddsNumerator, oddsDenominator),
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
      'Wager matched'
    );
  }

  /**
   * Cancel an open P2P wager
   */
  async cancelWager(wagerId: string): Promise<string> {
    return this.executeTx(
      () => (this.api as any).cancelWager(wagerId),
      'Wager offer withdrawn'
    );
  }

  /**
   * Claim winnings from a resolved P2P wager
   */
  async claimWagerWinnings(wagerId: string): Promise<string> {
    return this.executeTx(
      () => (this.api as any).claimWagerWinnings(wagerId),
      'Payout received'
    );
  }

  /**
   * Look up a specific market directly from the on-chain ledger
   */
  getOnChainMarket(marketId: bigint): any | null {
    return this.api?.getOnChainMarket(marketId) || null;
  }

  /**
   * Look up a specific wager directly from the on-chain ledger
   */
  getOnChainWager(wagerId: bigint): any | null {
    return this.api?.getOnChainWager(wagerId) || null;
  }

  /**
   * Look up a specific bet directly from the on-chain ledger
   */
  getOnChainBet(betId: bigint): any | null {
    return this.api?.getOnChainBet(betId) || null;
  }
  
  /**
   * Initialize the contract on-chain (admin only)
   */
  async executeContractInitialize(): Promise<string> {
    return this.executeTx(
      () => (this.api as any).initialize(),
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
   * Get the user's private identity key
   */
  getUserSecretKey(): Uint8Array | null {
    return this.api?.getUserSecretKey() || null;
  }

  /**
   * Subscribe to contract state updates
   */
  subscribeToState(callback: (state: any) => void): Subscription | null {
    if (!this.api) {
      console.warn('Cannot subscribe to state: contract not initialized');
      return null;
    }

    return from(this.api.state$).subscribe(callback);
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
