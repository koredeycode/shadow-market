/**
 * Witness providers for the unified prediction market contract
 * 
 * Ephemeral state pattern (matching example-locker style)
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

// -----------------------------------------------------------------------------
// EPHEMERAL CONTEXT (Global variables to be set before calling circuit)
// -----------------------------------------------------------------------------

let _betAmount = 0n;
let _betSide = 0;
let _betNonce: Uint8Array = new Uint8Array(32);
let _wagerAmount = 0n;

/**
 * Sets the context for pool betting
 */
export const setBetContext = (amount: bigint, side: number, nonce?: Uint8Array): void => {
  _betAmount = amount;
  _betSide = side;
  _betNonce = nonce ?? new Uint8Array(32);
  if (!nonce) {
    const randomBits = randomBytes(16);
    _betNonce.set(randomBits, 0);
  }
};

/**
 * Sets the context for P2P wagering
 */
export const setWagerAmount = (amount: bigint): void => {
  _wagerAmount = amount;
};

/**
 * Create witness providers using the ephemeral context
 */
export const createWitnessProviders = (privateState: MarketPrivateState) => ({
  /**
   * Provides the user's secret key from PrivateState
   */
  userSecretKey: (ctx: WitnessContext<Ledger, MarketPrivateState>): [MarketPrivateState, Uint8Array] => {
    return [privateState, privateState.userSecretKey];
  },

  /**
   * Provides the bet amount from ephemeral context
   */
  betAmount: (ctx: WitnessContext<Ledger, MarketPrivateState>): [MarketPrivateState, bigint] => {
    return [privateState, _betAmount];
  },

  /**
   * Provides the bet side from ephemeral context
   */
  betSide: (ctx: WitnessContext<Ledger, MarketPrivateState>): [MarketPrivateState, number] => {
    return [privateState, _betSide];
  },

  /**
   * Provides the nonce from ephemeral context
   */
  betNonce: (ctx: WitnessContext<Ledger, MarketPrivateState>): [MarketPrivateState, Uint8Array] => {
    return [privateState, _betNonce];
  },

  /**
   * Provides the wager amount from ephemeral context
   */
  wagerAmountInput: (ctx: WitnessContext<Ledger, MarketPrivateState>): [MarketPrivateState, bigint] => {
    return [privateState, _wagerAmount];
  },
});

/**
 * Witness type derived from the witness provider functions
 */
export type MarketWitnesses = ReturnType<typeof createWitnessProviders>;
