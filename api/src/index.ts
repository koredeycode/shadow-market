/**
 * Shadow Market API - Contract integration layer
 *
 * This module provides a structured API for interacting with the Shadow Market
 * smart contract on the Midnight network. It implements the Observable pattern
 * for state management following the bboard example.
 *
 * Status: Using REAL contract integration with deployed shadow-market.compact
 *
 * @packageDocumentation
 */

import type { ContractAddress } from '@midnight-ntwrk/compact-runtime';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { findDeployedContract, type DeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { ShadowMarketContract, compiledShadowMarketContract, ledger as contractLedger } from '@shadow-market/contracts';
import { map, Observable, shareReplay } from 'rxjs';
import {
  createProvidersFromWallet,
  getOrCreatePrivateState,
  type MarketPrivateState,
  type MarketProviders,
} from './providers.js';
import { stringToBytes32, safeRandomNonce, fromHex } from './utils.js';
import { setBetContext, setWagerAmount } from './witnesses.js';

/**
 * Configuration for connecting to a deployed contract
 */
export interface DeployedShadowMarketConfig {
  indexerUri: string;
  indexerWsUri: string;
  proverServerUri: string;
  zkConfigPath?: string;
  contractAddress?: ContractAddress;
  networkId: string;
  shieldedCoinPublicKey?: string;
  shieldedEncryptionPublicKey?: string;
}

/**
 * Ledger state from contract
 */
export type Ledger = ReturnType<typeof contractLedger>;

/**
 * Deployed contract type
 */
type DeployedShadowMarketContract = DeployedContract<any>;

/**
 * Derived state combining public and private data
 */
export interface MarketDerivedState {
  ledger: Ledger;
  isInitialized: boolean;
  marketCount: bigint;
  wagerCount: bigint;
  betCount: bigint;
}

/**
 * Shadow Market API - Real on-chain contract integration
 */
export class ShadowMarketAPI {
  private deployedContract: DeployedShadowMarketContract;
  private providers: MarketProviders;
  private privateState: MarketPrivateState;
  public readonly state$: Observable<MarketDerivedState>;
  public readonly deployedContractAddress: ContractAddress;

  /**
   * Private constructor - use ShadowMarketAPI.connect() instead
   */
  private constructor(
    deployedContract: DeployedShadowMarketContract,
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
          const ledger = contractLedger(contractState.data);
          this.latestLedger = ledger;
          console.log('[DEBUG] ShadowMarketAPI: Ledger state update received:', {
            isInitialized: ledger.isInitialized.toString(),
            marketCount: ledger.marketCount.toString(),
            wagerCount: ledger.wagerCount.toString(),
            betCount: ledger.betCount.toString()
          });
          return {
            ledger,
            isInitialized: ledger.isInitialized > 0n,
            marketCount: ledger.marketCount,
            wagerCount: ledger.wagerCount,
            betCount: ledger.betCount,
          };
        }),
        shareReplay(1)
      );

    console.log('ShadowMarketAPI connected to contract:', this.deployedContractAddress);
  }

  /**
   * Set a callback for transaction status updates (milestones)
   */
  public setStatusCallback(cb: (status: any, data?: any) => void): void {
    if (this.providers.onStatusUpdate && typeof (this.providers.onStatusUpdate as any) === 'function') {
      (this.providers.onStatusUpdate as any)(cb);
    }
  }

  private latestLedger: Ledger | null = null;

  /**
   * Get a specific market from the on-chain ledger
   */
  getOnChainMarket(marketId: bigint): any | null {
    if (!this.latestLedger) return null;
    try {
      return this.latestLedger.markets.lookup(marketId);
    } catch (e) {
      return null;
    }
  }

  /**
   * Get a specific wager from the on-chain ledger
   */
  getOnChainWager(wagerId: bigint): any | null {
    if (!this.latestLedger) return null;
    try {
      return this.latestLedger.wagers.lookup(wagerId);
    } catch (e) {
      return null;
    }
  }

  /**
   * Get a specific bet from the on-chain ledger
   */
  getOnChainBet(betId: bigint): any | null {
    if (!this.latestLedger) return null;
    try {
      return this.latestLedger.bets.lookup(betId);
    } catch (e) {
      return null;
    }
  }

  /**
   * Initialize the contract (sets adminKey and marks as initialized)
   * This should be called once after deployment.
   */
  async initialize(): Promise<string> {
    console.log('INITIALIZING CONTRACT ON-CHAIN');

    try {
      const initializeFn = this.deployedContract.callTx.initialize;
      const txData = await (initializeFn as any)();
      console.log('Contract initialized! Transaction:', txData.public.txHash);
      return txData.public.txHash;
    } catch (error: any) {
      console.error('initialize circuit execution failed:', error);
      throw new Error(`Failed to initialize contract: ${error.message}`);
    }
  }

  /**
   * Place a bet on a prediction market (AMM pool)
   */
  async placeBet(
    marketId: string,
    betAmount: bigint,
    betOutcome: boolean
  ): Promise<{ txHash: string; onchainId: string }> {
    console.log(
      `PLACING BET ON-CHAIN: market=${marketId}, amount=${betAmount}, side=${betOutcome ? 'YES' : 'NO'}`
    );

    try {
      // Update witnesses context (mocked for now, but should be handled by providers)
      // For node/script environment, we can set the context if our provider supports it
      const outcomeEnum = betOutcome ? 2 : 1; // Outcome.YES=2, Outcome.NO=1

      // Use the new ephemeral witness pattern
      setBetContext(betAmount, outcomeEnum);

      const txData = await (this.deployedContract.callTx.placeBet as any)(
        BigInt(marketId),
        outcomeEnum
      );

      console.log('Bet placed! Transaction:', txData.public.txHash);
      console.log('DEBUG: Full txData response:', JSON.stringify(txData, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value, 2));

      // Use the last disclosed value for on-chain ID
      const onchainId = this.getDisclosedId(txData);
      console.log('Disclosed Bet ID:', onchainId);

      return { txHash: txData.public.txHash, onchainId };
    } catch (error: any) {
      console.error('placeBet circuit execution failed:', error);
      throw new Error(`Failed to place bet: ${error.message}`);
    }
  }

  /**
   * Claim winnings from a resolved market
   * @param betId The bet ID to claim winnings for
   */
  async claimWinnings(betId: string): Promise<string> {
    console.log(`CLAIMING POOL WINNINGS ON-CHAIN: betId=${betId}`);

    try {
      const userAddress = this.providers.walletProvider.getCoinPublicKey();
      const txData = await (this.deployedContract.callTx.claimPoolWinnings as any)(
        BigInt(betId),
        userAddress
      );

      console.log('Winnings claimed! Transaction:', txData.public.txHash);
      return txData.public.txHash;
    } catch (error: any) {
      console.error('claimPoolWinnings circuit execution failed:', error);
      throw new Error(`Failed to claim winnings: ${error.message}`);
    }
  }

  /**
   * Add liquidity to an AMM pool (not implemented in contract)
   */
  async addLiquidity(marketId: string, amount: bigint): Promise<void> {
    throw new Error('addLiquidity circuit not available in Shadow Market contract');
  }

  /**
   * Remove liquidity from an AMM pool (not implemented in contract)
   */
  async removeLiquidity(marketId: string, lpTokenAmount: bigint): Promise<void> {
    throw new Error('removeLiquidity circuit not available in Shadow Market contract');
  }

  /**
   * Create a new prediction market
   */
  async createMarket(
    question: string,
    resolutionTime: bigint
  ): Promise<{ txHash: string; onchainId: string }> {
    console.log(`CREATING MARKET ON-CHAIN: ${question}, endTime=${resolutionTime}`);

    try {
      const titleBytes = stringToBytes32(question);
      
      const createMarketFn = this.deployedContract.callTx.createMarket;
      
      const txData = await (createMarketFn as any)(
        resolutionTime,
        titleBytes
      );
      
      console.log('DEBUG: Full txData response:', JSON.stringify(txData, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value, 2));

      const onchainId = this.getDisclosedId(txData);
      console.log('Disclosed Market ID:', onchainId);
      
      return { txHash: txData.public.txHash, onchainId };
    } catch (error: any) {
      console.error('createMarket circuit execution failed:', error);
      throw new Error(`Failed to create market: ${error.message}`);
    }
  }

  /**
   * Lock a market (admin only)
   */
  async lockMarket(marketId: string): Promise<string> {
    console.log(`LOCKING MARKET ON-CHAIN: ${marketId}`);

    try {
      const txData = await (this.deployedContract.callTx.lockMarket as any)(BigInt(marketId));

      console.log('Market locked! Transaction:', txData.public.txHash);
      return txData.public.txHash;
    } catch (error: any) {
      console.error('lockMarket circuit execution failed:', error);
      throw new Error(`Failed to lock market: ${error.message}`);
    }
  }

  /**
   * Resolve a market with the outcome
   */
  async resolveMarket(marketId: string, outcome: boolean): Promise<string> {
    console.log(`RESOLVING MARKET ON-CHAIN: ${marketId}, outcome=${outcome ? 'YES' : 'NO'}`);

    try {
      const outcomeEnum = outcome ? 2 : 1; // Outcome.YES=2, Outcome.NO=1
      
      const txData = await (this.deployedContract.callTx.resolveMarket as any)(
        BigInt(marketId),
        outcomeEnum
      );

      console.log('Market resolved! Transaction:', txData.public.txHash);
      return txData.public.txHash;
    } catch (error: any) {
      console.error('resolveMarket circuit execution failed:', error);
      throw new Error(`Failed to resolve market: ${error.message}`);
    }
  }

  /**
   * Create a P2P wager
   */
  async createWager(
    marketId: string,
    side: boolean,
    amount: bigint,
    oddsNumerator: bigint,
    oddsDenominator: bigint
  ): Promise<{ txHash: string; onchainId: string }> {
    console.log(`CREATING P2P WAGER ON-CHAIN: market=${marketId}, amount=${amount}`);

    try {
      // Use the new ephemeral witness pattern
      setWagerAmount(amount);

      const outcomeEnum = side ? 2 : 1; // YES=2, NO=1

      const txData = await (this.deployedContract.callTx.createWager as any)(
        BigInt(marketId),
        outcomeEnum,
        oddsNumerator,
        oddsDenominator
      );

      console.log('Wager created! Transaction:', txData.public.txHash);
      console.log('DEBUG: Full txData response:', JSON.stringify(txData, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value, 2));
      
      const onchainId = this.getDisclosedId(txData);
      console.log('Disclosed Wager ID:', onchainId);

      return { txHash: txData.public.txHash, onchainId };
    } catch (error: any) {
      console.error('createWager circuit execution failed:', error);
      throw new Error(`Failed to create wager: ${error.message}`);
    }
  }

  /**
   * Accept a P2P wager
   */
  async acceptWager(wagerId: string): Promise<string> {
    console.log(`ACCEPTING WAGER ON-CHAIN: ${wagerId}`);

    try {
      const txData = await (this.deployedContract.callTx.acceptWager as any)(BigInt(wagerId));

      console.log('Wager accepted! Transaction:', txData.public.txHash);
      return txData.public.txHash;
    } catch (error: any) {
      console.error('acceptWager circuit execution failed:', error);
      throw new Error(`Failed to accept wager: ${error.message}`);
    }
  }

  /**
   * Cancel a P2P wager
   */
  async cancelWager(wagerId: string): Promise<string> {
    console.log(`CANCELING WAGER ON-CHAIN: ${wagerId}`);

    try {
      const txData = await (this.deployedContract.callTx.cancelWager as any)(BigInt(wagerId));

      console.log('Wager cancelled! Transaction:', txData.public.txHash);
      return txData.public.txHash;
    } catch (error: any) {
      console.error('cancelWager circuit execution failed:', error);
      throw new Error(`Failed to cancel wager: ${error.message}`);
    }
  }

  /**
   * Claim winnings from a P2P wager
   */
  async claimWagerWinnings(wagerId: string): Promise<string> {
    console.log(`CLAIMING WAGER WINNINGS ON-CHAIN: ${wagerId}`);

    try {
      const userAddress = this.providers.walletProvider.getCoinPublicKey();
      const txData = await (this.deployedContract.callTx.claimWagerWinnings as any)(
        BigInt(wagerId),
        userAddress
      );

      console.log('Wager winnings claimed! Transaction:', txData.public.txHash);
      return txData.public.txHash;
    } catch (error: any) {
      console.error('claimWagerWinnings circuit execution failed:', error);
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
   */
  /**
   * Connect to a deployed contract using existing providers.
   * Useful for Node.js/scripts where providers are already initialized.
   */
  static async connectWithProviders(
    providers: MarketProviders,
    contractAddress: ContractAddress
  ): Promise<ShadowMarketAPI> {
    console.log('Connecting to Shadow Market contract with existing providers...');
    
    // Set contract address on provider as it's required for scoped private state
    if (typeof (providers.privateStateProvider as any).setContractAddress === 'function') {
      (providers.privateStateProvider as any).setContractAddress(contractAddress);
    }
    
    // Get or create private state
    const privateState = await getOrCreatePrivateState(providers.privateStateProvider);

    // Bind witnesses before finding the contract
    const compiledWithWitnesses = (compiledShadowMarketContract as any).pipe(
      (CompiledContract as any).withWitnesses((providers as any).witnesses)
    );

    const deployedContract = (await findDeployedContract(providers, {
      compiledContract: compiledWithWitnesses,
      contractAddress,
      privateStateId: 'shadow-market-private-state',
      initialPrivateState: privateState,
    } as any)) as DeployedShadowMarketContract;

    return new ShadowMarketAPI(deployedContract, providers, privateState);
  }

  static async connect(
    wallet: ConnectedAPI,
    config: DeployedShadowMarketConfig
  ): Promise<ShadowMarketAPI> {
    console.log('Connecting to Shadow Market contract via wallet...');
    setNetworkId(config.networkId); // Set global network ID for SDK v4

    try {
      // Create all SDK providers
      const providers = await createProvidersFromWallet(wallet, config);

      if (!config.contractAddress) {
        throw new Error('Contract address required for connection');
      }

      return await ShadowMarketAPI.connectWithProviders(providers, config.contractAddress);
    } catch (error: any) {
      console.error('Failed to connect to contract:', error);
      throw new Error(`Contract connection failed: ${error.message}`);
    }
  }

  /**
   * Robustly extracts IDs from transaction results, which may be located in several places
   * depending on the Compact version, Indexer configuration, and the type of call.
   */
  private getDisclosedId(txData: any): string {
    console.log('DEBUG: >>> START DISCLOSED ID EXTRACTION <<<');
    
    // Log full public data for user review as requested
    if (txData.public) {
      // Use a custom replacer to handle BigInts in txData for logging
      console.log('DEBUG: Full txData.public:', JSON.stringify(txData.public, (k, v) => 
        typeof v === 'bigint' ? v.toString() : v, 2));
    }

    // 1. Collect all candidates from all possible locations
    const candidates: any[] = [];
    
    // Standard compact result locations
    const standardLocs = [
      { name: 'public.disclosed', val: txData.public?.disclosed },
      { name: 'disclosed', val: txData.disclosed },
      { name: 'result.disclosed', val: txData.result?.disclosed },
      { name: 'result.events', val: txData.result?.events },
      { name: 'public.args', val: txData.public?.args }
    ];

    standardLocs.forEach(loc => {
      if (loc.val) {
        console.log(`DEBUG: Found candidate in ${loc.name}:`, loc.val);
        if (Array.isArray(loc.val)) candidates.push(...loc.val);
        else candidates.push(loc.val);
      }
    });

    // Transcript-based locations (POPEQ)
    if (txData.public?.publicTranscript) {
      console.log('DEBUG: Scanning publicTranscript...');
      txData.public.publicTranscript.forEach((op: any, i: number) => {
        if (op.popeq?.result?.value) {
          console.log(`DEBUG: Found POPEQ [${i}] in publicTranscript:`, op.popeq.result.value);
          candidates.push(op.popeq.result.value);
        }
      });
    }

    if (txData.public?.partitionedTranscript) {
      console.log('DEBUG: Scanning partitionedTranscript...');
      txData.public.partitionedTranscript.forEach((section: any, si: number) => {
        if (section?.program) {
          section.program.forEach((op: any, oi: number) => {
            if (op.popeq?.result?.value) {
              console.log(`DEBUG: Found POPEQ [${si}:${oi}] in partitionedTranscript:`, op.popeq.result.value);
              candidates.push(op.popeq.result.value);
            } else if (op.push?.value?.tag === 'cell' && op.push.value.content?.value) {
               console.log(`DEBUG: Found push-cell [${si}:${oi}] in partitionedTranscript:`, op.push.value.content.value);
               candidates.push(op.push.value.content.value);
            }
          });
        }
      });
    }

    // Extraction function for various Midnight JS object formats
    const extractValue = (val: any): any => {
      if (val === null || val === undefined) return null;
      
      if (val instanceof Uint8Array || (typeof val === 'object' && val.constructor?.name === 'Uint8Array')) {
        if (val.length === 0) return null; // Ignore empty arrays as they are likely spacer/padding
        
        // Small arrays (<=8 bytes) are treated as numbers/counters (ID, endTime)
        if (val.length <= 8) {
          let res = 0n;
          for (let i = 0; i < val.length; i++) res = (res << 8n) | BigInt(val[i]);
          return res;
        }
        
        // Larger arrays are hex strings (title, hash)
        return Array.from(val).map((b: any) => b.toString(16).padStart(2, '0')).join('');
      }

      if (Array.isArray(val)) {
        if (val.length === 0) return null;
        if (val.length === 1) return extractValue(val[0]);
        return extractValue(val[val.length - 1]);
      }
      
      if (typeof val === 'object') {
        if ('0' in val && Object.keys(val).length === 1) return extractValue(val['0']);
        if ('value' in val) return extractValue(val.value);
        if ('tag' in val && 'value' in val) return extractValue(val.value);
      }
      
      return val;
    };

    // Filter and map candidates to valid values
    const validValues = candidates
      .map(c => ({ raw: c, processed: extractValue(c) }))
      .filter(item => {
        const v = item.processed;
        return v !== null && v !== undefined && v.toString().trim() !== '';
      });

    console.log('DEBUG: Filtered Valid ID Candidates:', validValues.map(v => v.processed.toString()));

    if (validValues.length === 0) {
      console.warn('CRITICAL: No valid ID candidates extracted from transaction!');
      if (txData.public?.identifiers?.length > 1) return txData.public.identifiers[1].toString();
      return '';
    }

    // Usually, the ID is the LAST counter disclosed in the circuit
    const resultId = validValues[validValues.length - 1].processed.toString();
    console.log('DEBUG: Selected result ID:', resultId);
    console.log('DEBUG: >>> END DISCLOSED ID EXTRACTION <<<');
    
    return resultId;
  }
}

// Export types and utilities
export { createProvidersFromWallet, getOrCreatePrivateState } from './providers.js';
export { createWitnessProviders } from './witnesses.js';
export type { MarketPrivateState, MarketProviders };
