import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
export interface MarketPrivateState {
    userSecretKey: Uint8Array;
}
type Ledger = any;
interface CircuitContext {
    betAmount?: bigint;
    betSide?: bigint;
    wagerAmount?: bigint;
}
export declare const createWitnessProviders: (privateState: MarketPrivateState, context?: CircuitContext) => {
    userSecretKey: (ctx: WitnessContext<Ledger, MarketPrivateState>) => [MarketPrivateState, Uint8Array];
    betAmount: (ctx: WitnessContext<Ledger, MarketPrivateState>) => [MarketPrivateState, bigint];
    betSide: (ctx: WitnessContext<Ledger, MarketPrivateState>) => [MarketPrivateState, bigint];
    betNonce: (ctx: WitnessContext<Ledger, MarketPrivateState>) => [MarketPrivateState, Uint8Array];
    wagerAmountInput: (ctx: WitnessContext<Ledger, MarketPrivateState>) => [MarketPrivateState, bigint];
    callerAddress: (ctx: WitnessContext<Ledger, MarketPrivateState>) => [MarketPrivateState, Uint8Array];
};
export type MarketWitnesses = ReturnType<typeof createWitnessProviders>;
export {};
//# sourceMappingURL=witnesses.d.ts.map