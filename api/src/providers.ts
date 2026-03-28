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
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { randomBytes } from './utils.js';
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
export type PrivateStateId = 'unified-market-private-state';

/**
 * Configuration for provider setup
 */
export interface ProviderConfig {
  indexerUri: string;
  indexerWsUri: string;
  proverServerUri: string;
  zkConfigPath?: string;
  networkId: string;
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
};

/**
 * Creates all providers from wallet connection
 */
export const createProvidersFromWallet = async (
  wallet: ConnectedAPI,
  config: ProviderConfig
): Promise<MarketProviders> => {
  const walletConfig = await wallet.getConfiguration();

  // Public data provider - reads blockchain state from indexer
  const publicDataProvider = indexerPublicDataProvider(config.indexerUri, config.indexerWsUri);

  // Private state provider - manages user's secret keys
  const privateStateProvider = new MemoryPrivateStateProvider();

  // ZK config provider - provides circuit proving/verification keys
  const zkConfigProvider = new FetchZkConfigProvider(
    config.zkConfigPath || `${config.indexerUri}/zk-config`,
    fetch
  );

  // Proof provider - generates ZK proofs via proof server
  const proofProvider = httpClientProofProvider(config.proverServerUri, zkConfigProvider);

  // Get or create private state
  const privateStateKey = 'unified-market-private-state';
  let privateState = await privateStateProvider.get<MarketPrivateState>(privateStateKey);

  if (!privateState) {
    // Generate new secret key for this user
    const secretKey = randomBytes(32);
    privateState = { userSecretKey: secretKey };
    await privateStateProvider.set(privateStateKey, privateState);
    console.log('🔑 Generated new user secret key');
  }

  // Create witness providers
  const witnesses = createWitnessProviders(privateState);

  // Wallet provider wraps the connected wallet API
  const walletProvider = {
    submitTransaction: async (tx: any) => {
      return await wallet.submitTransaction(tx);
    },
    getState: async () => {
      return await wallet.getConnectionStatus();
    },
  };

  // Midnight provider combines all transaction submission capabilities
  const midnightProvider = {
    submitTransaction: walletProvider.submitTransaction,
    getState: walletProvider.getState,
  };

  return {
    publicDataProvider,
    privateStateProvider: privateStateProvider as any,
    zkConfigProvider: zkConfigProvider as any,
    proofProvider,
    midnightProvider: midnightProvider as any,
    walletProvider: walletProvider as any,
    witnesses,
  };
};

/**
 * Gets existing private state or creates a new one
 */
export const getOrCreatePrivateState = async (
  privateStateProvider: any
): Promise<MarketPrivateState> => {
  const privateStateKey = 'unified-market-private-state';
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
