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
 * Creates witness providers with a shared, updatable context.
 */
export const createWitnessProviders = (
  privateState: MarketPrivateState, 
  context: MarketWitnessContext = {}
) => {
  // Return the witnesses bound to the mutable context object
  return {
    // Current context accessor for external updates
    updateContext: (newContext: MarketWitnessContext) => {
      Object.assign(context, newContext);
    },
    
    userSecretKey: (ctx: WitnessContext<Ledger, MarketPrivateState>): [MarketPrivateState, Uint8Array] => {
      return [privateState, privateState.userSecretKey];
    },

    betAmount: (ctx: WitnessContext<Ledger, MarketPrivateState>): [MarketPrivateState, bigint] => {
      return [privateState, context.betAmount ?? 0n];
    },

    betSide: (ctx: WitnessContext<Ledger, MarketPrivateState>): [MarketPrivateState, number] => {
      return [privateState, context.betSide ?? 0];
    },

    betNonce: (ctx: WitnessContext<Ledger, MarketPrivateState>): [MarketPrivateState, Uint8Array] => {
      return [privateState, context.betNonce ?? new Uint8Array(32).fill(0)];
    },

    wagerAmountInput: (ctx: WitnessContext<Ledger, MarketPrivateState>): [MarketPrivateState, bigint] => {
      return [privateState, context.wagerAmount ?? 0n];
    },

    betPayout: (ctx: WitnessContext<Ledger, MarketPrivateState>): [MarketPrivateState, bigint] => {
      return [privateState, context.betPayout ?? 0n];
    },

    betRemainder: (ctx: WitnessContext<Ledger, MarketPrivateState>): [MarketPrivateState, bigint] => {
      return [privateState, context.betRemainder ?? 0n];
    },
  };
};

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
