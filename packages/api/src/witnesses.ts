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
  bets: Record<string, {
    amount: bigint;
    side: number;
    nonce: Uint8Array;
  }>;
}

/**
 * Ephemeral context used to provide witnesses for a specific circuit execution.
 * To avoid race conditions, do not use global variables for this.
 */
export interface MarketWitnessContext {
  betAmount?: bigint;
  betSide?: number;
  betNonce?: Uint8Array;
  wagerAmount?: bigint;
  betPayout?: bigint;
  betRemainder?: bigint;
}

type Ledger = any;

/**
 * Create witness providers for a specific transaction/call context.
 * 
 * @param privateState The user's persisted private state
 * @param ephemeralContext Context for the current operation (to avoid race conditions)
 */
export const createWitnessProviders = (
  privateState: MarketPrivateState, 
  ephemeralContext: MarketWitnessContext = {}
) => ({
  userSecretKey: (ctx: WitnessContext<Ledger, MarketPrivateState>): [MarketPrivateState, Uint8Array] => {
    return [privateState, privateState.userSecretKey];
  },

  betAmount: (ctx: WitnessContext<Ledger, MarketPrivateState>): [MarketPrivateState, bigint] => {
    return [privateState, ephemeralContext.betAmount ?? 0n];
  },

  betSide: (ctx: WitnessContext<Ledger, MarketPrivateState>): [MarketPrivateState, number] => {
    return [privateState, ephemeralContext.betSide ?? 0];
  },

  betNonce: (ctx: WitnessContext<Ledger, MarketPrivateState>): [MarketPrivateState, Uint8Array] => {
    return [privateState, ephemeralContext.betNonce ?? new Uint8Array(32).fill(0)];
  },

  wagerAmountInput: (ctx: WitnessContext<Ledger, MarketPrivateState>): [MarketPrivateState, bigint] => {
    return [privateState, ephemeralContext.wagerAmount ?? 0n];
  },

  betPayout: (ctx: WitnessContext<Ledger, MarketPrivateState>): [MarketPrivateState, bigint] => {
    return [privateState, ephemeralContext.betPayout ?? 0n];
  },

  betRemainder: (ctx: WitnessContext<Ledger, MarketPrivateState>): [MarketPrivateState, bigint] => {
    return [privateState, ephemeralContext.betRemainder ?? 0n];
  },
});

/**
 * Utility to generate a safe random nonce for new bets
 */
export const generateBetNonce = (): Uint8Array => {
  const nonce = new Uint8Array(32).fill(0);
  const randomBits = randomBytes(16);
  nonce.set(randomBits, 0);
  return nonce;
};

export type MarketWitnesses = ReturnType<typeof createWitnessProviders>;
