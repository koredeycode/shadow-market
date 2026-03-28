import type { ContractAddress } from '@midnight-ntwrk/compact-runtime';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { ledger as contractLedger } from '@shadow-market/contracts';
import { Observable } from 'rxjs';
import { type MarketPrivateState, type MarketProviders } from './providers.js';
export interface DeployedShadowMarketConfig {
    indexerUri: string;
    indexerWsUri: string;
    proverServerUri: string;
    zkConfigPath?: string;
    contractAddress?: ContractAddress;
    networkId: string;
}
export type Ledger = ReturnType<typeof contractLedger>;
export interface MarketDerivedState {
    ledger: Ledger;
    isInitialized: boolean;
    marketCount: bigint;
    wagerCount: bigint;
}
export declare class ShadowMarketAPI {
    private deployedContract;
    private providers;
    private privateState;
    readonly state$: Observable<MarketDerivedState>;
    readonly deployedContractAddress: ContractAddress;
    private constructor();
    initialize(): Promise<void>;
    placeBet(marketId: string, betAmount: bigint, betOutcome: boolean): Promise<void>;
    claimWinnings(betId: string): Promise<void>;
    addLiquidity(marketId: string, amount: bigint): Promise<void>;
    removeLiquidity(marketId: string, lpTokenAmount: bigint): Promise<void>;
    createMarket(question: string, resolutionTime: bigint, initialLiquidity: bigint, oracleAddress: string): Promise<void>;
    lockMarket(marketId: string): Promise<void>;
    resolveMarket(marketId: string, outcome: boolean): Promise<void>;
    createWager(marketId: string, side: boolean, oddsNumerator: bigint, oddsDenominator: bigint): Promise<void>;
    acceptWager(wagerId: string): Promise<void>;
    cancelWager(wagerId: string): Promise<void>;
    claimWagerWinnings(wagerId: string): Promise<void>;
    getContractAddress(): string;
    subscribeToState(callback: (state: MarketDerivedState) => void): import("rxjs").Subscription;
    static connect(wallet: ConnectedAPI, config: DeployedShadowMarketConfig): Promise<ShadowMarketAPI>;
}
export { createProvidersFromWallet, getOrCreatePrivateState } from './providers.js';
export { createWitnessProviders } from './witnesses.js';
export type { MarketPrivateState, MarketProviders };
//# sourceMappingURL=index.d.ts.map