import { type WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { Ledger } from './managed/simple-market/contract/index.js';

/**
 * Private state for simple-market contract
 */
export type SimpleMarketPrivateState = {
  readonly userSecret: Uint8Array;
};

/**
 * Creates an initial private state with a random user secret
 */
export const createSimpleMarketPrivateState = (
  userSecret?: Uint8Array
): SimpleMarketPrivateState => ({
  userSecret: userSecret || crypto.getRandomValues(new Uint8Array(32)),
});

/**
 * Witness function implementations for simple-market contract
 * These provide private inputs to the ZK circuits
 */
export const witnesses = {
  /**
   * Returns the user's secret key for bet commitments
   */
  userSecretKey: ({
    privateState,
  }: WitnessContext<Ledger, SimpleMarketPrivateState>): [SimpleMarketPrivateState, Uint8Array] => {
    return [privateState, privateState.userSecret];
  },

  /**
   * Returns the bet amount (will be provided by UI)
   */
  betAmount: ({
    privateState,
  }: WitnessContext<Ledger, SimpleMarketPrivateState>): [SimpleMarketPrivateState, bigint] => {
    return [privateState, 0n];
  },

  /**
   * Returns the bet side: 1 for YES, 0 for NO
   */
  betSide: ({
    privateState,
  }: WitnessContext<Ledger, SimpleMarketPrivateState>): [SimpleMarketPrivateState, bigint] => {
    return [privateState, 0n];
  },

  /**
   * Returns a unique nonce for the bet
   */
  betNonce: ({
    privateState,
  }: WitnessContext<Ledger, SimpleMarketPrivateState>): [SimpleMarketPrivateState, bigint] => {
    return [privateState, 0n];
  },
};
