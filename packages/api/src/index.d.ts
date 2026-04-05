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
    shieldedCoinPublicKey?: string;
    shieldedEncryptionPublicKey?: string;
}
export type Ledger = ReturnType<typeof contractLedger>;
export interface MarketDerivedState {
    ledger: Ledger;
    isInitialized: boolean;
    marketCount: bigint;
    wagerCount: bigint;
    betCount: bigint;
}
export declare class ShadowMarketAPI {
    private deployedContract;
    private providers;
    private privateState;
    readonly state$: Observable<MarketDerivedState>;
    readonly deployedContractAddress: ContractAddress;
    private constructor();
    setStatusCallback(cb: (status: any, data?: any) => void): void;
    private latestLedger;
    getOnChainMarket(marketId: bigint): any | null;
    getOnChainWager(wagerId: bigint): any | null;
    getOnChainBet(betId: bigint): any | null;
    initialize(): Promise<string>;
    placeBet(marketId: string, betAmount: bigint, betOutcome: boolean): Promise<{
        txHash: string;
        onchainId: string;
    }>;
    claimWinnings(betId: string): Promise<string>;
    createMarket(question: string, resolutionTime: bigint): Promise<{
        txHash: string;
        onchainId: string;
    }>;
    lockMarket(marketId: string): Promise<string>;
    resolveMarket(marketId: string, outcome: boolean): Promise<string>;
    createWager(marketId: string, side: boolean, amount: bigint, oddsNumerator: bigint, oddsDenominator: bigint): Promise<{
        txHash: string;
        onchainId: string;
    }>;
    acceptWager(wagerId: string): Promise<string>;
    cancelWager(wagerId: string): Promise<string>;
    claimWagerWinnings(wagerId: string): Promise<string>;
    getContractAddress(): string;
    subscribeToState(callback: (state: MarketDerivedState) => void): import("node_modules/rxjs/dist/types/index.js").Subscription;
    static connectWithProviders(providers: MarketProviders, contractAddress: ContractAddress): Promise<ShadowMarketAPI>;
    static connect(wallet: ConnectedAPI, config: DeployedShadowMarketConfig): Promise<ShadowMarketAPI>;
    private getDisclosedId;
    private extractValue;
}
export { createProvidersFromWallet, getOrCreatePrivateState } from './providers.js';
export { createWitnessProviders } from './witnesses.js';
export type { MarketPrivateState, MarketProviders };
//# sourceMappingURL=index.d.ts.map