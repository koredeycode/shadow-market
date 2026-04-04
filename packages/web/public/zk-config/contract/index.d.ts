import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Market = { status: number;
                       endTime: bigint;
                       outcome: number;
                       title: Uint8Array;
                       yesTotal: bigint;
                       noTotal: bigint;
                       betCount: bigint;
                       wagerCount: bigint
                     };

export type Bet = { marketId: bigint;
                    userKey: Uint8Array;
                    commitment: Uint8Array;
                    claimed: number
                  };

export type Wager = { marketId: bigint;
                      creatorKey: Uint8Array;
                      takerKey: Uint8Array;
                      amount: bigint;
                      matchAmount: bigint;
                      side: number;
                      oddsNum: bigint;
                      oddsDenom: bigint;
                      status: number;
                      claimed: number
                    };

export type Witnesses<PS> = {
  userSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  betAmount(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  betSide(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, number];
  betNonce(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  wagerAmountInput(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
}

export type ImpureCircuits<PS> = {
  initialize(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  createMarket(context: __compactRuntime.CircuitContext<PS>,
               endTime_0: bigint,
               title_0: Uint8Array): __compactRuntime.CircuitResults<PS, bigint>;
  placeBet(context: __compactRuntime.CircuitContext<PS>,
           marketId_0: bigint,
           side_0: number): __compactRuntime.CircuitResults<PS, bigint>;
  createWager(context: __compactRuntime.CircuitContext<PS>,
              marketId_0: bigint,
              side_0: number,
              oddsNumerator_0: bigint,
              oddsDenominator_0: bigint): __compactRuntime.CircuitResults<PS, bigint>;
  acceptWager(context: __compactRuntime.CircuitContext<PS>, wagerId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  cancelWager(context: __compactRuntime.CircuitContext<PS>, wagerId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  lockMarket(context: __compactRuntime.CircuitContext<PS>, marketId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  resolveMarket(context: __compactRuntime.CircuitContext<PS>,
                marketId_0: bigint,
                outcome_0: number): __compactRuntime.CircuitResults<PS, []>;
  claimPoolWinnings(context: __compactRuntime.CircuitContext<PS>,
                    betId_0: bigint,
                    user_addr_0: { bytes: Uint8Array }): __compactRuntime.CircuitResults<PS, []>;
  claimWagerWinnings(context: __compactRuntime.CircuitContext<PS>,
                     wagerId_0: bigint,
                     user_addr_0: { bytes: Uint8Array }): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  initialize(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  createMarket(context: __compactRuntime.CircuitContext<PS>,
               endTime_0: bigint,
               title_0: Uint8Array): __compactRuntime.CircuitResults<PS, bigint>;
  placeBet(context: __compactRuntime.CircuitContext<PS>,
           marketId_0: bigint,
           side_0: number): __compactRuntime.CircuitResults<PS, bigint>;
  createWager(context: __compactRuntime.CircuitContext<PS>,
              marketId_0: bigint,
              side_0: number,
              oddsNumerator_0: bigint,
              oddsDenominator_0: bigint): __compactRuntime.CircuitResults<PS, bigint>;
  acceptWager(context: __compactRuntime.CircuitContext<PS>, wagerId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  cancelWager(context: __compactRuntime.CircuitContext<PS>, wagerId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  lockMarket(context: __compactRuntime.CircuitContext<PS>, marketId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  resolveMarket(context: __compactRuntime.CircuitContext<PS>,
                marketId_0: bigint,
                outcome_0: number): __compactRuntime.CircuitResults<PS, []>;
  claimPoolWinnings(context: __compactRuntime.CircuitContext<PS>,
                    betId_0: bigint,
                    user_addr_0: { bytes: Uint8Array }): __compactRuntime.CircuitResults<PS, []>;
  claimWagerWinnings(context: __compactRuntime.CircuitContext<PS>,
                     wagerId_0: bigint,
                     user_addr_0: { bytes: Uint8Array }): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  initialize(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  createMarket(context: __compactRuntime.CircuitContext<PS>,
               endTime_0: bigint,
               title_0: Uint8Array): __compactRuntime.CircuitResults<PS, bigint>;
  placeBet(context: __compactRuntime.CircuitContext<PS>,
           marketId_0: bigint,
           side_0: number): __compactRuntime.CircuitResults<PS, bigint>;
  createWager(context: __compactRuntime.CircuitContext<PS>,
              marketId_0: bigint,
              side_0: number,
              oddsNumerator_0: bigint,
              oddsDenominator_0: bigint): __compactRuntime.CircuitResults<PS, bigint>;
  acceptWager(context: __compactRuntime.CircuitContext<PS>, wagerId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  cancelWager(context: __compactRuntime.CircuitContext<PS>, wagerId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  lockMarket(context: __compactRuntime.CircuitContext<PS>, marketId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  resolveMarket(context: __compactRuntime.CircuitContext<PS>,
                marketId_0: bigint,
                outcome_0: number): __compactRuntime.CircuitResults<PS, []>;
  claimPoolWinnings(context: __compactRuntime.CircuitContext<PS>,
                    betId_0: bigint,
                    user_addr_0: { bytes: Uint8Array }): __compactRuntime.CircuitResults<PS, []>;
  claimWagerWinnings(context: __compactRuntime.CircuitContext<PS>,
                     wagerId_0: bigint,
                     user_addr_0: { bytes: Uint8Array }): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly adminKey: Uint8Array;
  readonly isInitialized: bigint;
  readonly marketCount: bigint;
  readonly betCount: bigint;
  readonly wagerCount: bigint;
  markets: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): Market;
    [Symbol.iterator](): Iterator<[bigint, Market]>
  };
  bets: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): Bet;
    [Symbol.iterator](): Iterator<[bigint, Bet]>
  };
  wagers: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): Wager;
    [Symbol.iterator](): Iterator<[bigint, Wager]>
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
