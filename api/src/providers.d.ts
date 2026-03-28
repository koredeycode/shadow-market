import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { type MarketWitnesses } from './witnesses.js';
export interface MarketPrivateState {
    userSecretKey: Uint8Array;
}
export type PrivateStateId = 'shadow-market-private-state';
export interface ProviderConfig {
    indexerUri: string;
    indexerWsUri: string;
    proverServerUri: string;
    zkConfigPath?: string;
    networkId: string;
}
export type MarketCircuitKeys = 'initialize' | 'createMarket' | 'placeBet' | 'createWager' | 'acceptWager' | 'cancelWager' | 'lockMarket' | 'resolveMarket' | 'claimPoolWinnings' | 'claimWagerWinnings';
export type MarketProviders = MidnightProviders<MarketCircuitKeys, PrivateStateId, MarketPrivateState> & {
    witnesses: MarketWitnesses;
};
export declare const createProvidersFromWallet: (wallet: ConnectedAPI, config: ProviderConfig) => Promise<MarketProviders>;
export declare const getOrCreatePrivateState: (privateStateProvider: any) => Promise<MarketPrivateState>;
//# sourceMappingURL=providers.d.ts.map