/**
 * Unified Market API - Contract integration layer
 *
 * This module provides a structured API for interacting with the Shadow Market
 * smart contract on the Midnight network. It implements the Observable pattern
 * for state management following the bboard example.
 *
 * Status: Using REAL contract integration with deployed unified-prediction-market
 *
 * @packageDocumentation
 */

import type { ContractAddress } from '@midnight-ntwrk/compact-runtime';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { findDeployedContract, type DeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { UnifiedMarket } from '@shadow-market/contracts';
import { map, Observable } from 'rxjs';
import {
  createProvidersFromWallet,
  getOrCreatePrivateState,
  type MarketPrivateState,
  type MarketProviders,
} from './providers.js';

/**
 * Configuration for connecting to a deployed contract
 */
export interface DeployedUnifiedMarketConfig {
  indexerUri: string;
  indexerWsUri: string;
  proverServerUri: string;
  zkConfigPath?: string;
  contractAddress?: ContractAddress;
  networkId: string;
}

/**
 * Ledger state from contract
 */
export type Ledger = ReturnType<typeof UnifiedMarket.ledger>;

/**
 * Deployed contract type
 */
type DeployedUnifiedMarketContract = DeployedContract<typeof UnifiedMarket>;

/**
 * Derived state combining public and private data
 */
export interface MarketDerivedState {
  ledger: Ledger;
  isInitialized: boolean;
  marketCount: bigint;
  wagerCount: bigint;
}

/**
 * Unified Market API - Real on-chain contract integration
 *
 * @remarks
 * This API follows the pattern from example-bboard-clone:
 * - Static .connect() method for initialization
 * - Observable state$ for reactive updates
 * - Witness providers for private circuit inputs
 * - Real on-chain transaction execution
 */
export class UnifiedMarketAPI {
  private deployedContract: DeployedUnifiedMarketContract;
  private providers: MarketProviders;
  private privateState: MarketPrivateState;
  public readonly state$: Observable<MarketDerivedState>;
  public readonly deployedContractAddress: ContractAddress;

  /**
   * Private constructor - use UnifiedMarketAPI.connect() instead
   */
  private constructor(
    deployedContract: DeployedUnifiedMarketContract,
    providers: MarketProviders,
    privateState: MarketPrivateState
  ) {
    this.deployedContract = deployedContract;
    this.providers = providers;
    this.privateState = privateState;
    this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;

    // Set up observable state stream from contract ledger
    this.state$ = providers.publicDataProvider
      .contractStateObservable(this.deployedContractAddress, { type: 'latest' })
      .pipe(
        map(contractState => {
          const ledger = UnifiedMarket.ledger(contractState.data);
          return {
            ledger,
            isInitialized: ledger.isInitialized > 0n,
            marketCount: ledger.marketCount,
            wagerCount: ledger.wagerCount,
          };
        })
      );

    console.log('✅ UnifiedMarketAPI connected to contract:', this.deployedContractAddress);
  }

  /**
   * Place a bet on a prediction market (AMM pool)
   */
  async placeBet(marketId: string, betAmount: bigint, betOutcome: boolean): Promise<void> {
    console.log(
      `🚀 PLACING BET ON-CHAIN: market=${marketId}, amount=${betAmount}, side=${betOutcome ? 'YES' : 'NO'}`
    );

    try {
      const txData = await this.deployedContract.callTx.placeBet(
        BigInt(marketId),
        betOutcome ? 1n : 0n
      );

      console.log('✅ Bet placed! Transaction:', txData.public.txHash);
      console.log('   Block height:', txData.public.blockHeight);
    } catch (error: any) {
      console.error('❌ placeBet circuit execution failed:', error);
      throw new Error(`Failed to place bet: ${error.message}`);
    }
  }

  /**
   * Claim winnings from a resolved market
   * @param betId The bet ID to claim winnings for
   */
  async claimWinnings(betId: string): Promise<void> {
    console.log(`🚀 CLAIMING POOL WINNINGS ON-CHAIN: betId=${betId}`);

    try {
      const txData = await this.deployedContract.callTx.claimPoolWinnings(BigInt(betId));

      console.log('✅ Winnings claimed! Transaction:', txData.public.txHash);
      console.log('   Block height:', txData.public.blockHeight);
    } catch (error: any) {
      console.error('❌ claimPoolWinnings circuit execution failed:', error);
      throw new Error(`Failed to claim winnings: ${error.message}`);
    }
  }

  /**
   * Add liquidity to an AMM pool (not implemented in contract)
   */
  async addLiquidity(marketId: string, amount: bigint): Promise<void> {
    throw new Error('addLiquidity circuit not available in unified-prediction-market contract');
  }

  /**
   * Remove liquidity from an AMM pool (not implemented in contract)
   */
  async removeLiquidity(marketId: string, lpTokenAmount: bigint): Promise<void> {
    throw new Error('removeLiquidity circuit not available in unified-prediction-market contract');
  }

  /**
   * Create a new prediction market
   * @param endTime Unix timestamp when market closes
   * @param minBet Minimum bet amount
   */
  async createMarket(
    question: string,
    resolutionTime: bigint,
    initialLiquidity: bigint,
    oracleAddress: string
  ): Promise<void> {
    console.log(`🚀 CREATING MARKET ON-CHAIN: ${question}, endTime=${resolutionTime}`);

    try {
      // Note: question and oracleAddress are stored off-chain (in backend DB)
      // On-chain we only store endTime and minBet
      const txData = await this.deployedContract.callTx.createMarket(
        resolutionTime, // endTime
        initialLiquidity // minBet
      );

      console.log('✅ Market created! Transaction:', txData.public.txHash);
      console.log('   Block height:', txData.public.blockHeight);
    } catch (error: any) {
      console.error('❌ createMarket circuit execution failed:', error);
      throw new Error(`Failed to create market: ${error.message}`);
    }
  }

  /**
   * Lock a market (admin only)
   */
  async lockMarket(marketId: string): Promise<void> {
    console.log(`🚀 LOCKING MARKET ON-CHAIN: ${marketId}`);

    try {
      const txData = await this.deployedContract.callTx.lockMarket(BigInt(marketId));

      console.log('✅ Market locked! Transaction:', txData.public.txHash);
      console.log('   Block height:', txData.public.blockHeight);
    } catch (error: any) {
      console.error('❌ lockMarket circuit execution failed:', error);
      throw new Error(`Failed to lock market: ${error.message}`);
    }
  }

  /**
   * Resolve a market with the outcome
   */
  async resolveMarket(marketId: string, outcome: boolean): Promise<void> {
    console.log(`🚀 RESOLVING MARKET ON-CHAIN: ${marketId}, outcome=${outcome ? 'YES' : 'NO'}`);

    try {
      const txData = await this.deployedContract.callTx.resolveMarket(
        BigInt(marketId),
        outcome ? 1n : 0n
      );

      console.log('✅ Market resolved! Transaction:', txData.public.txHash);
      console.log('   Block height:', txData.public.blockHeight);
    } catch (error: any) {
      console.error('❌ resolveMarket circuit execution failed:', error);
      throw new Error(`Failed to resolve market: ${error.message}`);
    }
  }

  /**
   * Cancel an unresolved market (not implemented in current contract)
   */
  async cancelMarket(marketId: string): Promise<void> {
    throw new Error('cancelMarket circuit not available in unified-prediction-market contract');
  }

  /**
   * Withdraw funds from cancelled market (not implemented in current contract)
   */
  async withdrawFromCancelled(marketId: string): Promise<void> {
    throw new Error(
      'withdrawFromCancelled circuit not available in unified-prediction-market contract'
    );
  }

  /**
   * Create a P2P wager
   */
  async createWager(
    marketId: string,
    side: boolean,
    oddsNumerator: bigint,
    oddsDenominator: bigint
  ): Promise<void> {
    console.log(`🚀 CREATING P2P WAGER ON-CHAIN: market=${marketId}`);

    try {
      const txData = await this.deployedContract.callTx.createWager(
        BigInt(marketId),
        side ? 1n : 0n,
        oddsNumerator,
        oddsDenominator
      );

      console.log('✅ Wager created! Transaction:', txData.public.txHash);
      console.log('   Block height:', txData.public.blockHeight);
    } catch (error: any) {
      console.error('❌ createWager circuit execution failed:', error);
      throw new Error(`Failed to create wager: ${error.message}`);
    }
  }

  /**
   * Accept a P2P wager
   */
  async acceptWager(wagerId: string): Promise<void> {
    console.log(`🚀 ACCEPTING WAGER ON-CHAIN: ${wagerId}`);

    try {
      const txData = await this.deployedContract.callTx.acceptWager(BigInt(wagerId));

      console.log('✅ Wager accepted! Transaction:', txData.public.txHash);
      console.log('   Block height:', txData.public.blockHeight);
    } catch (error: any) {
      console.error('❌ acceptWager circuit execution failed:', error);
      throw new Error(`Failed to accept wager: ${error.message}`);
    }
  }

  /**
   * Cancel a P2P wager
   */
  async cancelWager(wagerId: string): Promise<void> {
    console.log(`🚀 CANCELING WAGER ON-CHAIN: ${wagerId}`);

    try {
      const txData = await this.deployedContract.callTx.cancelWager(BigInt(wagerId));

      console.log('✅ Wager cancelled! Transaction:', txData.public.txHash);
      console.log('   Block height:', txData.public.blockHeight);
    } catch (error: any) {
      console.error('❌ cancelWager circuit execution failed:', error);
      throw new Error(`Failed to cancel wager: ${error.message}`);
    }
  }

  /**
   * Claim winnings from a P2P wager
   */
  async claimWagerWinnings(wagerId: string): Promise<void> {
    console.log(`🚀 CLAIMING WAGER WINNINGS ON-CHAIN: ${wagerId}`);

    try {
      const txData = await this.deployedContract.callTx.claimWagerWinnings(BigInt(wagerId));

      console.log('✅ Wager winnings claimed! Transaction:', txData.public.txHash);
      console.log('   Block height:', txData.public.blockHeight);
    } catch (error: any) {
      console.error('❌ claimWagerWinnings circuit execution failed:', error);
      throw new Error(`Failed to claim wager winnings: ${error.message}`);
    }
  }

  /**
   * Get the deployed contract address
   */
  getContractAddress(): string {
    return this.deployedContractAddress;
  }

  /**
   * Subscribe to contract state updates
   */
  subscribeToState(callback: (state: MarketDerivedState) => void) {
    return this.state$.subscribe(callback);
  }

  /**
   * Connect to an existing deployed contract
   *
   * This is the main entry point - call this to initialize the API
   *
   * @param wallet - Connected wallet from Midnight connector
   * @param config - Network and contract configuration
   * @returns Initialized API instance
   */
  static async connect(
    wallet: ConnectedAPI,
    config: DeployedUnifiedMarketConfig
  ): Promise<UnifiedMarketAPI> {
    console.log('🔌 Connecting to Unified Market contract...');

    try {
      // Create all SDK providers
      const providers = await createProvidersFromWallet(wallet, config);

      // Get or create private state
      const privateState = await getOrCreatePrivateState(providers.privateStateProvider);

      console.log('✅ Providers and private state initialized');

      // Find the deployed contract
      if (!config.contractAddress) {
        throw new Error('Contract address required for connection');
      }

      const deployedContract = (await findDeployedContract(
        providers,
        UnifiedMarket
      )) as DeployedUnifiedMarketContract;

      if (deployedContract.deployTxData.public.contractAddress !== config.contractAddress) {
        console.warn('⚠️ Found contract address does not match config - using found address');
      }

      console.log(
        '✅ Found deployed contract at:',
        deployedContract.deployTxData.public.contractAddress
      );

      return new UnifiedMarketAPI(deployedContract, providers, privateState);
    } catch (error: any) {
      console.error('❌ Failed to connect to contract:', error);
      throw new Error(`Contract connection failed: ${error.message}`);
    }
  }
}

// Export types and utilities
export { createProvidersFromWallet, getOrCreatePrivateState } from './providers.js';
export { createWitnessProviders } from './witnesses.js';
export type { MarketPrivateState, MarketProviders };
