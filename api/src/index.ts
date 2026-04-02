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
    console.log('DEBUG: getDisclosedId scanning txData...');
    
    // 1. Try standard locations (disclosed array)
    let disclosed = 
      txData.public?.disclosed || 
      txData.disclosed || 
      txData.result?.disclosed || 
      txData.result?.events ||
      (txData.public?.args && txData.public.args.length > 0 ? txData.public.args : null);
    
    if (disclosed && Array.isArray(disclosed) && disclosed.length > 0) {
      console.log('DEBUG: Found disclosed values in standard location:', disclosed);
    }

    // 2. Fallback: Parse publicTranscript for POPEQ operations
    if ((!disclosed || (Array.isArray(disclosed) && disclosed.length === 0)) && txData.public?.publicTranscript) {
      console.log('DEBUG: Scanning publicTranscript for disclosed values...');
      const extracted: any[] = [];
      for (const op of txData.public.publicTranscript) {
        if (op.popeq?.result?.value) {
          extracted.push(op.popeq.result.value);
        }
      }
      if (extracted.length > 0) {
        disclosed = extracted;
        console.log('DEBUG: Extracted from publicTranscript:', disclosed);
      }
    }

    // 3. Fallback: Parse partitionedTranscript programs for POPEQ
    if ((!disclosed || (Array.isArray(disclosed) && disclosed.length === 0)) && txData.public?.partitionedTranscript) {
      console.log('DEBUG: Scanning partitionedTranscript for disclosed values...');
      const extracted: any[] = [];
      for (const section of txData.public.partitionedTranscript) {
        if (section?.program) {
          for (const op of section.program) {
            if (op.popeq?.result?.value) {
              extracted.push(op.popeq.result.value);
            } else if (op.push?.value?.tag === 'cell' && op.push.value.content?.value) {
              // Sometimes disclosed values are pushed as cells in the transcript
               extracted.push(op.push.value.content.value);
            }
          }
        }
      }
      if (extracted.length > 0) {
        disclosed = extracted;
        console.log('DEBUG: Extracted from partitionedTranscript:', disclosed);
      }
    }
    
    if (!disclosed || (Array.isArray(disclosed) && disclosed.length === 0)) {
      console.warn('CRITICAL: No disclosed values found in any location!', {
        txHash: txData.txHash || txData.hash,
        publicKeys: Object.keys(txData.public || {}),
        resultKeys: Object.keys(txData.result || {})
      });

      // LAST RESORT: Check identifiers or result
      if (txData.public?.identifiers?.length > 1) {
        const fallbackId = txData.public.identifiers[1];
        console.log('WARNING: Falling back to secondary identifier:', fallbackId);
        return fallbackId.toString();
      }
      
      if (txData.result && !Array.isArray(txData.result) && typeof txData.result === 'object') {
        const resultVal = txData.result.value || txData.result.id;
        if (resultVal !== undefined) return resultVal.toString();
      }

      // If we are here, we might have successfully placed a bet/market but can't find the ID.
      // Don't throw, just return empty and let the caller handle it.
      return '';
    }

    // Capture the LAST disclosed value (usually the ID in our circuits)
    const rawFinal = Array.isArray(disclosed) ? disclosed[disclosed.length - 1] : disclosed;
    console.log('DEBUG: Raw final disclosed value:', rawFinal);

    // Deep extraction function for various Midnight JS object formats
    const extractValue = (val: any): any => {
      if (val === null || val === undefined) return val;
      
      // Handle Uint8Array (often 1-byte or 8-byte for numbers)
      if (val instanceof Uint8Array || (typeof val === 'object' && val.constructor?.name === 'Uint8Array')) {
        if (val.length === 0) return '';
        if (val.length <= 8) {
          let res = 0n;
          for (let i = 0; i < val.length; i++) {
            res = (res << 8n) | BigInt(val[i]);
          }
          return res;
        }
        return Array.from(val).map((b: any) => b.toString(16).padStart(2, '0')).join('');
      }

      if (Array.isArray(val)) {
        if (val.length === 0) return '';
        
        // If it's an array of length 1, peel it
        if (val.length === 1) return extractValue(val[0]);
        
        // Special case: Array of objects that look like bytes { '0': index }
        // This often happens in transcript scanning
        if (val.every(item => typeof item === 'object' && item !== null && '0' in item && Object.keys(item).length === 1)) {
          let res = 0n;
          for (const item of val) {
            res = (res << 8n) | BigInt(item['0']);
          }
          return res;
        }

        // If it's an array of Uint8Arrays (common in some transcript versions)
        if (val.every(item => item instanceof Uint8Array || (typeof item === 'object' && item?.constructor?.name === 'Uint8Array'))) {
          let res = 0n;
          for (const item of val) {
            const byte = item.length > 0 ? item[0] : 0;
            res = (res << 8n) | BigInt(byte);
          }
          return res;
        }
        
        // Default to last item if it's a generic array
        return extractValue(val[val.length - 1]);
      }
      
      if (typeof val === 'object') {
        if ('0' in val) return extractValue(val['0']);
        if ('value' in val) return extractValue(val.value);
        if ('tag' in val && 'value' in val) return extractValue(val.value);
      }
      
      return val;
    };

    const finalId = extractValue(rawFinal);
    console.log('DEBUG: Extracted final ID:', finalId);
    
    return finalId !== null && finalId !== undefined ? finalId.toString() : '';
  }
}

// Export types and utilities
export { createProvidersFromWallet, getOrCreatePrivateState } from './providers.js';
export { createWitnessProviders } from './witnesses.js';
export type { MarketPrivateState, MarketProviders };
