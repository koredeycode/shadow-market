// Contract exports
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import {
  Contract as ShadowMarketContractType,
  ledger as contractLedger,
  pureCircuits as contractPureCircuits,
} from './managed/shadow-market/contract/index.js';

export {
  Contract as ShadowMarketContract,
  ledger,
  pureCircuits,
} from './managed/shadow-market/contract/index.js';

export * from './types.js';

export const compiledShadowMarketContract = CompiledContract.make('shadow-market', ShadowMarketContractType);

/**
 * Private state for the shadow market contract
 */
export interface MarketPrivateState {
  /**
   * User's secret key for transactions
   */
  userSecretKey: Uint8Array;
}

/**
 * Creates a new market private state with the given secret key
 */
export const createMarketPrivateState = (secretKey: Uint8Array): MarketPrivateState => ({
  userSecretKey: secretKey,
});

/**
 * Private state key identifier used by the contract
 */
export const marketPrivateStateKey = 'shadow-market-private-state';

/**
 * Private state ID type
 */
export type PrivateStateId = typeof marketPrivateStateKey;

/**
 * Private states schema for the application
 */
export type PrivateStates = {
  readonly [marketPrivateStateKey]: MarketPrivateState;
};
