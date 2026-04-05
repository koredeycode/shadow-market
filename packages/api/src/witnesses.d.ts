import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
export interface MarketPrivateState {
    userSecretKey: Uint8Array;
}
type Ledger = any;
export declare const setBetContext: (amount: bigint, side: number, nonce?: Uint8Array) => void;
export declare const setWagerAmount: (amount: bigint) => void;
export declare const createWitnessProviders: (privateState: MarketPrivateState) => {
    userSecretKey: (ctx: WitnessContext<Ledger, MarketPrivateState>) => [MarketPrivateState, Uint8Array];
    betAmount: (ctx: WitnessContext<Ledger, MarketPrivateState>) => [MarketPrivateState, bigint];
    betSide: (ctx: WitnessContext<Ledger, MarketPrivateState>) => [MarketPrivateState, number];
    betNonce: (ctx: WitnessContext<Ledger, MarketPrivateState>) => [MarketPrivateState, Uint8Array];
    wagerAmountInput: (ctx: WitnessContext<Ledger, MarketPrivateState>) => [MarketPrivateState, bigint];
};
export type MarketWitnesses = ReturnType<typeof createWitnessProviders>;
export {};
//# sourceMappingURL=witnesses.d.ts.map