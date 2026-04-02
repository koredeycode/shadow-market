// Contract exports
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import {
  Contract as ShadowMarketContractType,
} from './managed/shadow-market/contract/index.js';

export {
  Contract as ShadowMarketContract,
  ledger,
  pureCircuits,
} from './managed/shadow-market/contract/index.js';

export * from './types.js';
export * from './witnesses.js';

/**
 * Compiled contract artifact for production use
 */
export const compiledShadowMarketContract = CompiledContract.make('shadow-market', ShadowMarketContractType);

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
  readonly [marketPrivateStateKey]: import('./witnesses.js').MarketPrivateState;
};
