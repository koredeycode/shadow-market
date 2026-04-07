 import { type WitnessContext } from '@midnight-ntwrk/compact-runtime';
import { type Ledger } from './managed/shadow-market/contract/index.js';

// Private state only stores the permanent secret key
export interface MarketPrivateState {
  userSecretKey: Uint8Array;
}

export const createMarketPrivateState = (secretKey: Uint8Array): MarketPrivateState => ({
  userSecretKey: secretKey,
});

let _betContext: { amount: bigint, side: bigint, nonce: Uint8Array } = {
  amount: 0n,
  side: 0n,
  nonce: new Uint8Array(32),
};

let _wagerAmount = 0n;
let _betPayoutContext: { payout: bigint, remainder: bigint } = {
  payout: 0n,
  remainder: 0n,
};

/**
 * Sets the context for a pool bet transaction
 */
export const setBetContext = (amount: bigint, side: bigint, nonce: Uint8Array): void => {
  _betContext = { amount, side, nonce };
};

/**
 * Sets the amount for a wager create/accept transaction
 */
export const setWagerAmount = (amount: bigint): void => {
  _wagerAmount = amount;
};

/**
 * Sets the context for pool claim transaction
 */
export const setPayoutContext = (payout: bigint, remainder: bigint): void => {
  _betPayoutContext = { payout, remainder };
};

/**
 * Witness providers for the Shadow Market circuits
 */
export const witnesses = {
  // Permanent state from PrivateStateProvider
  userSecretKey: ({ privateState }: WitnessContext<Ledger, MarketPrivateState>): [MarketPrivateState, Uint8Array] =>
    [privateState, privateState.userSecretKey],

  // Ephemeral state injected just before the call
  betAmount: ({ privateState }: WitnessContext<Ledger, MarketPrivateState>): [MarketPrivateState, bigint] =>
    [privateState, _betContext.amount],

  betSide: ({ privateState }: WitnessContext<Ledger, MarketPrivateState>): [MarketPrivateState, bigint] =>
    [privateState, _betContext.side],

  betNonce: ({ privateState }: WitnessContext<Ledger, MarketPrivateState>): [MarketPrivateState, Uint8Array] =>
    [privateState, _betContext.nonce],

  wagerAmountInput: ({ privateState }: WitnessContext<Ledger, MarketPrivateState>): [MarketPrivateState, bigint] =>
    [privateState, _wagerAmount],

  betPayout: ({ privateState }: WitnessContext<Ledger, MarketPrivateState>): [MarketPrivateState, bigint] =>
    [privateState, _betPayoutContext.payout],

  betRemainder: ({ privateState }: WitnessContext<Ledger, MarketPrivateState>): [MarketPrivateState, bigint] =>
    [privateState, _betPayoutContext.remainder],
};
