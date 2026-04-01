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
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import type { 
  MidnightProviders,
} from '@midnight-ntwrk/midnight-js-types';
import type {
  UnprovenTransaction as UnboundTransaction,
  FinalizedTransaction,
  CoinPublicKey,
  EncPublicKey,
  TransactionId,
} from '@midnight-ntwrk/ledger-v8';
import {
  Transaction,
  SignatureEnabled,
  Proof,
  Binding
} from '@midnight-ntwrk/ledger-v8';
import { randomBytes, toHex, fromHex, safeRandomNonce } from './utils.js';
import { createWitnessProviders, type MarketWitnesses } from './witnesses.js';

/**
 * Private state for the market contract
 */
export interface MarketPrivateState {
  userSecretKey: Uint8Array;
}

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
 *
 * In production, this would persist to IndexedDB or similar
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
    // Memory provider doesn't need to scope by address, but satisfies the interface
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
 * Complete providers type for the market contract
 */
export type MarketProviders = MidnightProviders<
  MarketCircuitKeys,
  PrivateStateId,
  MarketPrivateState
> & {
  witnesses: MarketWitnesses;
  witnessContext: {
    betAmount: bigint;
    betSide: bigint;
    betNonce: Uint8Array;
    wagerAmount: bigint;
  };
};

/**
 * Creates all providers from wallet connection
 */
export const createProvidersFromWallet = async (
  wallet: ConnectedAPI,
  config: ProviderConfig
): Promise<MarketProviders> => {

  // Derive endpoints (appending suffixes if missing)
  const graphqlUri = config.indexerUri.endsWith('/graphql')
    ? config.indexerUri
    : `${config.indexerUri}/graphql`;

  const graphqlWsUri = config.indexerWsUri.endsWith('/graphql/ws')
    ? config.indexerWsUri
    : (config.indexerWsUri.endsWith('/ws') 
        ? config.indexerWsUri 
        : `${config.indexerWsUri}/graphql/ws`);

  // Public data provider - reads blockchain state from indexer
  const publicDataProvider = indexerPublicDataProvider(graphqlUri, graphqlWsUri);

  // Private state provider - manages user's secret keys
  const privateStateProvider = new MemoryPrivateStateProvider();

  // Derive base URI for ZK configs (stripping /graphql if present)
  const baseIndexerUri = config.indexerUri.replace(/\/graphql$/, '');

  // ZK config provider - provides circuit proving/verification keys
  const zkConfigProvider = new FetchZkConfigProvider(
    config.zkConfigPath || `${baseIndexerUri}/zk-config`,
    fetch
  );

  // Proof provider - generates ZK proofs via proof server
  const proofProvider = httpClientProofProvider(config.proverServerUri, zkConfigProvider);

  // Get or create private state
  const privateStateKey = 'shadow-market-private-state';
  let privateState = await privateStateProvider.get<MarketPrivateState>(privateStateKey);

  if (!privateState) {
    // Generate new secret key for this user
    const secretKey = randomBytes(32);
    privateState = { userSecretKey: secretKey };
    await privateStateProvider.set(privateStateKey, privateState);
    console.log('Generated new user secret key');
  }

  // Create witness providers
  const witnesses = createWitnessProviders(privateState);

  // Wallet provider implementation covering balancing and keys
  const walletProvider = {
    balanceTx: async (tx: UnboundTransaction, ttl?: Date): Promise<FinalizedTransaction> => {
      const txHex = toHex(tx.serialize()); 
      
      try {
        if (typeof (wallet as any).balanceUnsealedTransaction !== 'function') {
          throw new Error('Wallet does not support balanceUnsealedTransaction');
        }

        console.log('Waiting for wallet confirmation...');
        
        // Add a 120-second timeout to the balancing call
        const startTime = Date.now();
        const balancePromise = wallet.balanceUnsealedTransaction(txHex)
          .then((result) => {
            console.log(`Wallet balanced transaction in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
            return result;
          })
          .catch((err) => {
            console.error('Wallet balancing rejected:', err);
            throw err;
          });

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Balancing timed out after 120 seconds. Please check if the wallet popup is visible.')), 120000)
        );

        const balanced = await Promise.race([balancePromise, timeoutPromise]) as { tx: string };
        
        // Return the RAW bytes from the wallet. 
        // We do NOT deserialize here to ensure we don't touch the potentially sensitive header (v9).
        return fromHex(balanced.tx) as unknown as FinalizedTransaction;
      } catch (error: any) {
        console.error('Balancing phase failed:', error);
        throw new Error(`Balancing failed: ${error.message}. Please ensure you have DUST available.`);
      }
    },
    getCoinPublicKey: (): CoinPublicKey => {
      return config.shieldedCoinPublicKey as CoinPublicKey;
    },
    getEncryptionPublicKey: (): EncPublicKey => {
      return config.shieldedEncryptionPublicKey as EncPublicKey;
    },
  };

  // Midnight provider handles transaction submission
  const midnightProvider = {
    submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
      console.log('Submitting finalized transaction to wallet...');
      // In this new robust flow, tx IS the raw bytes from the wallet
      const txBytes = tx as unknown as Uint8Array;
      const txHex = toHex(txBytes);
      
      try {
        await (wallet as any).submitTransaction(txHex);
        console.log('Transaction successfully submitted!');
        
        // Extract the ID separately using a read-only deserialization
        // This ensures the submission wasn't affected by the deserialization process
        const txObj = Transaction.deserialize<SignatureEnabled, Proof, Binding>(
          'signature',
          'proof',
          'binding',
          txBytes
        );
        const txId = (txObj as any).identifiers()[0];
        
        console.log('On-chain Transaction ID:', txId);
        
        return txId as unknown as TransactionId;
      } catch (error: any) {
        console.error('Transaction submission failed:', error);
        throw new Error(`Submission failed: ${error.message}`);
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
    witnessContext: {
      betAmount: 0n,
      betSide: 0n,
      betNonce: safeRandomNonce(),
      wagerAmount: 0n,
    }
  };
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
