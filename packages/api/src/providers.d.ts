import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { type MarketPrivateState, type MarketWitnesses } from './witnesses.js';
export type { MarketPrivateState };
export type PrivateStateId = 'shadow-market-private-state';
export interface ProviderConfig {
    indexerUri: string;
    indexerWsUri: string;
    proverServerUri: string;
    zkConfigPath?: string;
    networkId: string;
    shieldedCoinPublicKey?: string;
    shieldedEncryptionPublicKey?: string;
}
export type MarketCircuitKeys = 'initialize' | 'createMarket' | 'placeBet' | 'createWager' | 'acceptWager' | 'cancelWager' | 'lockMarket' | 'resolveMarket' | 'claimPoolWinnings' | 'claimWagerWinnings';
export type MarketStatus = 'CLEANING' | 'SERIALIZING' | 'BALANCING_START' | 'BALANCING_END';
export type MarketProviders = MidnightProviders<MarketCircuitKeys, PrivateStateId, MarketPrivateState> & {
    witnesses: MarketWitnesses;
    onStatusUpdate?: (status: MarketStatus, data?: any) => void;
};
export declare const createProvidersFromWallet: (wallet: ConnectedAPI, config: ProviderConfig) => Promise<MarketProviders>;
export declare const getOrCreatePrivateState: (privateStateProvider: any) => Promise<MarketPrivateState>;
//# sourceMappingURL=providers.d.ts.map