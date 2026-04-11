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
  walletType?: 'lace' | '1am';
}

/**
 * LocalStorage private state provider for browser persistence.
 * Falls back to in-memory if localStorage is unavailable (e.g. Node.js).
 */
class PersistentPrivateStateProvider {
  private memoryStore = new Map<string, any>();
  private useLocalStorage: boolean;

  constructor() {
    this.useLocalStorage = typeof window !== 'undefined' && !!window.localStorage;
  }

  async get<T>(key: string): Promise<T | undefined> {
    if (this.useLocalStorage) {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          // REVIVER: Handles BigInt and Hex restoration
          const parsed = JSON.parse(value, (k, v) => {
            if (typeof v === 'string' && v.endsWith('n') && /^\d+n$/.test(v)) {
              return BigInt(v.slice(0, -1));
            }
            return v;
          });

          // Restore binary keys
          if (parsed && parsed.userSecretKey && typeof parsed.userSecretKey === 'string') {
            parsed.userSecretKey = fromHex(parsed.userSecretKey);
          }
          
          // Restore nonces in bets
          if (parsed && parsed.bets) {
            for (const id in parsed.bets) {
              if (typeof parsed.bets[id].nonce === 'string') {
                parsed.bets[id].nonce = fromHex(parsed.bets[id].nonce);
              }
            }
          }
          
          return parsed as T;
        } catch (e) {
          console.error('Failed to parse private state from localStorage', e);
        }
      }
    }
    return this.memoryStore.get(key);
  }

  async set<T>(key: string, value: any): Promise<void> {
    if (this.useLocalStorage) {
      // REPLACER: Handles BigInt and Uint8Array serialization
      const serialized = JSON.stringify(value, (k, v) => {
        if (typeof v === 'bigint') return v.toString() + 'n';
        if (v instanceof Uint8Array || (v && v.type === 'Buffer')) {
          return toHex(new Uint8Array(v.data || v));
        }
        return v;
      });
      localStorage.setItem(key, serialized);
    }
    this.memoryStore.set(key, value);
  }

  async delete(key: string): Promise<void> {
    if (this.useLocalStorage) {
      localStorage.removeItem(key);
    }
    this.memoryStore.delete(key);
  }

  setContractAddress(address: string): void {
    console.log(`Private state provider scoped to contract: ${address}`);
  }

  async getSigningKey(address: string): Promise<Uint8Array | undefined> {
    return this.memoryStore.get(`signing-key-${address}`);
  }

  async setSigningKey(address: string, key: Uint8Array): Promise<void> {
    this.memoryStore.set(`signing-key-${address}`, key);
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
  const privateStateProvider = new PersistentPrivateStateProvider();
  const baseIndexerUri = config.indexerUri.replace(/\/graphql$/, '');

  const zkConfigProvider = new FetchZkConfigProvider(
    config.zkConfigPath || `${baseIndexerUri}/zk-config`,
    fetch
  );

  let proofProvider;
  if (config.walletType === '1am') {
    console.log('Building 1AM-specific proof provider...');
    const provingProvider = await (wallet as any).getProvingProvider(zkConfigProvider);
    proofProvider = {
      async proveTx(unprovenTx: any) {
        const { CostModel } = await import('@midnight-ntwrk/ledger-v8');
        return unprovenTx.prove(provingProvider, (CostModel as any).initialCostModel());
      },
    };
  } else {
    proofProvider = httpClientProofProvider(config.proverServerUri, zkConfigProvider);
  }

  const privateStateKey = 'shadow-market-private-state';
  let privateState = await privateStateProvider.get<MarketPrivateState>(privateStateKey);

  if (!privateState) {
    const secretKey = randomBytes(32);
    privateState = { userSecretKey: secretKey, bets: {} };
    await privateStateProvider.set(privateStateKey, privateState);
    console.log('Generated new user secret key');
  }

  const witnesses = createWitnessProviders(privateState);

  // Original balanceTx - preserves exact serialization format from wallet
  const balanceTx_original = async (tx: UnboundTransaction, ttl?: Date): Promise<FinalizedTransaction> => {
    const serialized = tx.serialize();
    const txHex = toHex(serialized); 
    console.log(`[BALANCING] Raw tx: ${serialized.length} bytes / ${txHex.length} hex chars`);
    
    if (statusCallback) statusCallback('BALANCING_START');
    const balanced = await wallet.balanceUnsealedTransaction(txHex) as { tx: string };
    if (statusCallback) statusCallback('BALANCING_END');
    
    // Return a Transaction object instead of raw bytes, matching the bboard-ui pattern
    return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
      'signature', 'proof', 'binding', fromHex(balanced.tx)
    );
  };

  const walletProvider = {
    balanceTx: balanceTx_original, // Using the pattern from bboard-ui
    balanceTx_legacy: balanceTx_original,
    getCoinPublicKey: (): CoinPublicKey => config.shieldedCoinPublicKey as CoinPublicKey,
    getEncryptionPublicKey: (): EncPublicKey => config.shieldedEncryptionPublicKey as EncPublicKey,
  };

  const midnightProvider = {
    submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
      console.log('Submitting transaction via wallet...');
      // Extract the ID and serialize as hex, matching bboard-ui
      const txId = (tx as any).identifiers()[0] as unknown as TransactionId;
      console.log('Transaction ID:', txId);
      
      const serializedTx = toHex(tx.serialize());
      await (wallet as any).submitTransaction(serializedTx);
      
      console.log('Wallet accepted transaction');
      return txId;
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
    privateState = { userSecretKey: secretKey, bets: {} };
    await privateStateProvider.set(privateStateKey, privateState);
  }

  return privateState;
};
