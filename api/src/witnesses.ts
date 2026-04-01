/**
 * Witness providers for the unified prediction market contract
 */

import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import { randomBytes } from './utils.js';

/**
 * Private state for the market contract
 */
export interface MarketPrivateState {
  userSecretKey: Uint8Array;
}

/**
 * Ledger type (simplified - will be imported from compiled contract)
 */
type Ledger = any;

/**
 * Context data passed during circuit execution
 */
interface CircuitContext {
  betAmount?: bigint;
  betSide?: bigint;
  wagerAmount?: bigint;
}

/**
 * Creates witness providers for the unified market contract
 *
 * Witnesses provide private data needed during circuit execution:
 * - userSecretKey: User's private key for signing
 * - betAmount: Amount being bet (from transaction context)
 * - betSide: YES (1) or NO (0)
 * - betNonce: Random nonce for uniqueness
 * - wagerAmountInput: Amount for P2P wagers
 */
export const createWitnessProviders = (
  privateState: MarketPrivateState,
  context?: CircuitContext
) => ({
  /**
   * Provides the user's secret key
   */
  userSecretKey: (
    ctx: WitnessContext<Ledger, MarketPrivateState>
  ): [MarketPrivateState, Uint8Array] => {
    return [privateState, privateState.userSecretKey];
  },

  /**
   * Provides the bet amount from context
   */
  betAmount: (ctx: WitnessContext<Ledger, MarketPrivateState>): [MarketPrivateState, bigint] => {
    const amount = context?.betAmount ?? 0n;
    return [privateState, amount];
  },

  /**
   * Provides the bet side (YES=2, NO=1, NONE=0)
   */
  betSide: (ctx: WitnessContext<Ledger, MarketPrivateState>): [MarketPrivateState, bigint] => {
    const side = context?.betSide ?? 0n;
    return [privateState, side];
  },

  /**
   * Provides a random nonce for transaction uniqueness
   * Using 16 bytes (128 bits) ensures it fits in a Field range
   */
  betNonce: (ctx: WitnessContext<Ledger, MarketPrivateState>): [MarketPrivateState, Uint8Array] => {
    const nonce = new Uint8Array(32).fill(0);
    const randomBits = randomBytes(16);
    nonce.set(randomBits, 0);
    return [privateState, nonce];
  },

  /**
   * Provides the wager amount for P2P wagers
   */
  wagerAmountInput: (
    ctx: WitnessContext<Ledger, MarketPrivateState>
  ): [MarketPrivateState, bigint] => {
    const amount = context?.wagerAmount ?? 0n;
    return [privateState, amount];
  },

  /**
   * Provides the caller's address (placeholder for now)
   */
  callerAddress: (
    ctx: WitnessContext<Ledger, MarketPrivateState>
  ): [MarketPrivateState, Uint8Array] => {
    return [privateState, new Uint8Array(32).fill(0)];
  },
});

/**
 * Witness type derived from the witness provider functions
 */
export type MarketWitnesses = ReturnType<typeof createWitnessProviders>;
