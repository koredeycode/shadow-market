import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  userSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  betAmount(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  betSide(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  betNonce(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  wagerAmountInput(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
}

export type ImpureCircuits<PS> = {
  initialize(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  createMarket(context: __compactRuntime.CircuitContext<PS>,
               endTime_0: bigint,
               minBet_0: bigint,
               title_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  placeBet(context: __compactRuntime.CircuitContext<PS>,
           marketId_0: bigint,
           side_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  createWager(context: __compactRuntime.CircuitContext<PS>,
              marketId_0: bigint,
              side_0: bigint,
              oddsNumerator_0: bigint,
              oddsDenominator_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  acceptWager(context: __compactRuntime.CircuitContext<PS>, wagerId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  cancelWager(context: __compactRuntime.CircuitContext<PS>, wagerId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  lockMarket(context: __compactRuntime.CircuitContext<PS>, marketId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  resolveMarket(context: __compactRuntime.CircuitContext<PS>,
                marketId_0: bigint,
                outcome_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  claimPoolWinnings(context: __compactRuntime.CircuitContext<PS>,
                    betId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  claimWagerWinnings(context: __compactRuntime.CircuitContext<PS>,
                     wagerId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  initialize(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  createMarket(context: __compactRuntime.CircuitContext<PS>,
               endTime_0: bigint,
               minBet_0: bigint,
               title_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  placeBet(context: __compactRuntime.CircuitContext<PS>,
           marketId_0: bigint,
           side_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  createWager(context: __compactRuntime.CircuitContext<PS>,
              marketId_0: bigint,
              side_0: bigint,
              oddsNumerator_0: bigint,
              oddsDenominator_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  acceptWager(context: __compactRuntime.CircuitContext<PS>, wagerId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  cancelWager(context: __compactRuntime.CircuitContext<PS>, wagerId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  lockMarket(context: __compactRuntime.CircuitContext<PS>, marketId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  resolveMarket(context: __compactRuntime.CircuitContext<PS>,
                marketId_0: bigint,
                outcome_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  claimPoolWinnings(context: __compactRuntime.CircuitContext<PS>,
                    betId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  claimWagerWinnings(context: __compactRuntime.CircuitContext<PS>,
                     wagerId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  initialize(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  createMarket(context: __compactRuntime.CircuitContext<PS>,
               endTime_0: bigint,
               minBet_0: bigint,
               title_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  placeBet(context: __compactRuntime.CircuitContext<PS>,
           marketId_0: bigint,
           side_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  createWager(context: __compactRuntime.CircuitContext<PS>,
              marketId_0: bigint,
              side_0: bigint,
              oddsNumerator_0: bigint,
              oddsDenominator_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  acceptWager(context: __compactRuntime.CircuitContext<PS>, wagerId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  cancelWager(context: __compactRuntime.CircuitContext<PS>, wagerId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  lockMarket(context: __compactRuntime.CircuitContext<PS>, marketId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  resolveMarket(context: __compactRuntime.CircuitContext<PS>,
                marketId_0: bigint,
                outcome_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  claimPoolWinnings(context: __compactRuntime.CircuitContext<PS>,
                    betId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  claimWagerWinnings(context: __compactRuntime.CircuitContext<PS>,
                     wagerId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly adminKey: Uint8Array;
  readonly isInitialized: bigint;
  readonly marketCount: bigint;
  readonly wagerCount: bigint;
  marketIds: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): bigint;
    [Symbol.iterator](): Iterator<[bigint, bigint]>
  };
  marketStatus: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): bigint;
    [Symbol.iterator](): Iterator<[bigint, bigint]>
  };
  marketEndTime: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): bigint;
    [Symbol.iterator](): Iterator<[bigint, bigint]>
  };
  marketOutcome: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): bigint;
    [Symbol.iterator](): Iterator<[bigint, bigint]>
  };
  marketTitle: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): Uint8Array;
    [Symbol.iterator](): Iterator<[bigint, Uint8Array]>
  };
  poolYesTotal: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): bigint;
    [Symbol.iterator](): Iterator<[bigint, bigint]>
  };
  poolNoTotal: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): bigint;
    [Symbol.iterator](): Iterator<[bigint, bigint]>
  };
  poolBetCount: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): bigint;
    [Symbol.iterator](): Iterator<[bigint, bigint]>
  };
  readonly poolBetIdCounter: bigint;
  poolBetCommitments: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): Uint8Array;
    [Symbol.iterator](): Iterator<[bigint, Uint8Array]>
  };
  poolBetClaimed: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): bigint;
    [Symbol.iterator](): Iterator<[bigint, bigint]>
  };
  poolBetMarketId: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): bigint;
    [Symbol.iterator](): Iterator<[bigint, bigint]>
  };
  poolBetUserKey: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): Uint8Array;
    [Symbol.iterator](): Iterator<[bigint, Uint8Array]>
  };
  wagerMarketId: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): bigint;
    [Symbol.iterator](): Iterator<[bigint, bigint]>
  };
  wagerCreatorKey: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): Uint8Array;
    [Symbol.iterator](): Iterator<[bigint, Uint8Array]>
  };
  wagerTakerKey: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): Uint8Array;
    [Symbol.iterator](): Iterator<[bigint, Uint8Array]>
  };
  wagerAmount: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): bigint;
    [Symbol.iterator](): Iterator<[bigint, bigint]>
  };
  wagerMatchAmount: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): bigint;
    [Symbol.iterator](): Iterator<[bigint, bigint]>
  };
  wagerSide: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): bigint;
    [Symbol.iterator](): Iterator<[bigint, bigint]>
  };
  wagerOddsNum: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): bigint;
    [Symbol.iterator](): Iterator<[bigint, bigint]>
  };
  wagerOddsDenom: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): bigint;
    [Symbol.iterator](): Iterator<[bigint, bigint]>
  };
  wagerStatus: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): bigint;
    [Symbol.iterator](): Iterator<[bigint, bigint]>
  };
  wagerClaimed: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): bigint;
    [Symbol.iterator](): Iterator<[bigint, bigint]>
  };
  marketWagerCount: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): bigint;
    [Symbol.iterator](): Iterator<[bigint, bigint]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
