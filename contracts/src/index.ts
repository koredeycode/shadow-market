// Contract exports placeholder
// Will be populated after compilation

export * from './types.js';

// Export compiled unified prediction market contract
export * as UnifiedMarket from './managed/unified-prediction-market/contract/index.js';

// Compiled contract exports will be added here after running:
// pnpm run compile

/**
 * Private state for the unified prediction market contract
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
export const marketPrivateStateKey = 'unified-market-private-state';

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
