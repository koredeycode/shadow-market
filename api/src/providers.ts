/**
 * Provider factory for unified prediction market contract
 *
 * Creates all necessary providers from wallet connection:
 * - Public data provider (reads blockchain state)
 * - Private state provider (manages user secrets)
 * - ZK config provider (provides circuit configs)
 * - Midnight provider (submits transactions)
 * - Witnesses (provides private inputs to circuits)
 */

import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import type {
  CoinPublicKey,
  EncPublicKey,
  FinalizedTransaction,
  TransactionId,
  UnprovenTransaction as UnboundTransaction,
} from '@midnight-ntwrk/ledger-v8';
import {
  Binding,
  Proof,
  SignatureEnabled,
  Transaction
} from '@midnight-ntwrk/ledger-v8';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import type {
  MidnightProviders,
} from '@midnight-ntwrk/midnight-js-types';
import { fromHex, randomBytes, toHex } from './utils.js';
import { createWitnessProviders, type MarketPrivateState, type MarketWitnesses } from './witnesses.js';
export type { MarketPrivateState };

/**
 * Private state key identifier
 */
export type PrivateStateId = 'shadow-market-private-state';

/**
 * Configuration for provider setup
 */
export interface ProviderConfig {
  indexerUri: string;
  indexerWsUri: string;
  proverServerUri: string;
  zkConfigPath?: string;
  networkId: string;
  shieldedCoinPublicKey?: string;
  shieldedEncryptionPublicKey?: string;
}

/**
 * In-memory private state provider
 */
class MemoryPrivateStateProvider {
  private states = new Map<string, any>();

  async get<T>(key: string): Promise<T | undefined> {
    return this.states.get(key);
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.states.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.states.delete(key);
  }

  setContractAddress(address: string): void {
    console.log(`Private state provider scoped to contract: ${address}`);
  }

  async getSigningKey(address: string): Promise<Uint8Array | undefined> {
    return this.states.get(`signing-key-${address}`);
  }

  async setSigningKey(address: string, key: Uint8Array): Promise<void> {
    this.states.set(`signing-key-${address}`, key);
  }
}

/**
 * Circuit keys for the unified market contract
 */
export type MarketCircuitKeys =
  | 'initialize'
  | 'createMarket'
  | 'placeBet'
  | 'createWager'
  | 'acceptWager'
  | 'cancelWager'
  | 'lockMarket'
  | 'resolveMarket'
  | 'claimPoolWinnings'
  | 'claimWagerWinnings';

/**
 * Status of the transaction lifecycle
 */
export type MarketStatus = 'CLEANING' | 'SERIALIZING' | 'BALANCING_START' | 'BALANCING_END';

/**
 * Complete providers type for the market contract
 */
export type MarketProviders = MidnightProviders<
  MarketCircuitKeys,
  PrivateStateId,
  MarketPrivateState
> & {
  witnesses: MarketWitnesses;
  onStatusUpdate?: (status: MarketStatus, data?: any) => void;
};

/**
 * Creates all providers from wallet connection
 */
export const createProvidersFromWallet = async (
  wallet: ConnectedAPI,
  config: ProviderConfig
): Promise<MarketProviders> => {
  let statusCallback: ((status: MarketStatus, data?: any) => void) | undefined;

  const graphqlUri = config.indexerUri.endsWith('/graphql') ? config.indexerUri : `${config.indexerUri}/graphql`;
  const graphqlWsUri = config.indexerWsUri.endsWith('/graphql/ws') ? config.indexerWsUri : `${config.indexerWsUri}/graphql/ws`;

  const publicDataProvider = indexerPublicDataProvider(graphqlUri, graphqlWsUri);
  const privateStateProvider = new MemoryPrivateStateProvider();
  const baseIndexerUri = config.indexerUri.replace(/\/graphql$/, '');

  const zkConfigProvider = new FetchZkConfigProvider(
    config.zkConfigPath || `${baseIndexerUri}/zk-config`,
    fetch
  );

  const proofProvider = httpClientProofProvider(config.proverServerUri, zkConfigProvider);

  const privateStateKey = 'shadow-market-private-state';
  let privateState = await privateStateProvider.get<MarketPrivateState>(privateStateKey);

  if (!privateState) {
    const secretKey = randomBytes(32);
    privateState = { userSecretKey: secretKey };
    await privateStateProvider.set(privateStateKey, privateState);
    console.log('Generated new user secret key');
  }

  const witnesses = createWitnessProviders(privateState);

  // Original balanceTx kept for reference as requested
  const balanceTx_original = async (tx: UnboundTransaction, ttl?: Date): Promise<FinalizedTransaction> => {
    const txHex = toHex(tx.serialize()); 
    const balanced = await wallet.balanceUnsealedTransaction(txHex) as { tx: string };
    return fromHex(balanced.tx) as unknown as FinalizedTransaction;
  };

  /**
   * Refined balancing logic (v3) to address the persistent contract call hang issue.
   * Review of BUG.md shows a silent hang in the wallet's balanceUnboundTransaction logic
   * when processing contract call transactions versus deploy transactions.
   */
  const balanceTx_v3 = async (tx: UnboundTransaction, ttl?: Date): Promise<FinalizedTransaction> => {
    const txBytes = tx.serialize();
    const startTime = performance.now();
    
    try {
      if (typeof (wallet as any).balanceUnsealedTransaction !== 'function') {
        throw new Error('Wallet does not support balanceUnsealedTransaction');
      }

      console.log(`[v3 WORKAROUND] Initiated for unsealed transaction (${txBytes.length} bytes)`);
      
      // Step 1: Clean deserialization to normalize the transaction object
      if (statusCallback) statusCallback('CLEANING');
      console.log('[v3 WORKAROUND] Step 1: Cleaning transaction state...');
      const cleanTx = (Transaction as any).deserialize(
        'signature', 
        'proof', 
        'pre-binding', 
        txBytes
      );
      
      // Step 2: Convert to Hex
      if (statusCallback) statusCallback('SERIALIZING');
      const cleanTxHex = toHex(cleanTx.serialize());
      console.log(`[v3 WORKAROUND] Step 2: Serialized to hex (Length: ${cleanTxHex.length})`);
      
      // Step 3: Call wallet bridge and wait for balancing
      if (statusCallback) statusCallback('BALANCING_START');
      console.log('[v3 WORKAROUND] Step 3: Calling wallet.balanceUnsealedTransaction... (STUCK HERE?)');
      
      // Use a timeout to ensure we don't hang the UI forever
      const balancingPromise = wallet.balanceUnsealedTransaction(cleanTxHex) as Promise<{ tx: string }>;
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Balancing timeout (60s) reached - the wallet may have crashed or locked up internally')), 60000)
      );
      
      const balanced = await Promise.race([balancingPromise, timeoutPromise]) as { tx: string };
      
      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      if (statusCallback) statusCallback('BALANCING_END', { duration });
      console.log(`[v3 WORKAROUND] Step 4: Balancing successful. Duration: ${duration}s. Deserializing result...`);
      
      const result = fromHex(balanced.tx) as unknown as FinalizedTransaction;
      console.log('[v3 WORKAROUND] complete.');
      
      return result;
    } catch (error: any) {
      console.error('Balancing phase (v3) failed or timed out:', error);
      throw error;
    }
  };

  const walletProvider = {
    balanceTx: balanceTx_v3, // Using the new v3 method
    balanceTx_legacy: balanceTx_original, // Kept for reference
    getCoinPublicKey: (): CoinPublicKey => config.shieldedCoinPublicKey as CoinPublicKey,
    getEncryptionPublicKey: (): EncPublicKey => config.shieldedEncryptionPublicKey as EncPublicKey,
  };

  const midnightProvider = {
    submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
      console.log('Submitting finalized transaction to wallet...');
      const txBytes = tx as unknown as Uint8Array;
      const txHex = toHex(txBytes);
      
      try {
        await (wallet as any).submitTransaction(txHex);
        
        // Extract ID via clean deserialization
        const txObj = Transaction.deserialize<SignatureEnabled, Proof, Binding>(
          'signature', 'proof', 'binding', txBytes
        );
        const txId = (txObj as any).identifiers()[0];
        return txId as unknown as TransactionId;
      } catch (error: any) {
        console.error('Transaction submission failed:', error);
        throw error;
      }
    },
  };

  return {
    publicDataProvider,
    privateStateProvider: privateStateProvider as any,
    zkConfigProvider: zkConfigProvider as any,
    proofProvider,
    midnightProvider: midnightProvider as any,
    walletProvider: walletProvider as any,
    witnesses,
    onStatusUpdate: (cb: any) => { statusCallback = cb; }
  } as any;
};

/**
 * Gets existing private state or creates a new one
 */
export const getOrCreatePrivateState = async (
  privateStateProvider: any
): Promise<MarketPrivateState> => {
  const privateStateKey = 'shadow-market-private-state';
  let privateState = (await privateStateProvider.get(privateStateKey)) as
    | MarketPrivateState
    | undefined;

  if (!privateState) {
    const secretKey = randomBytes(32);
    privateState = { userSecretKey: secretKey };
    await privateStateProvider.set(privateStateKey, privateState);
  }

  return privateState;
};
