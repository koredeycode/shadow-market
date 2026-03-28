import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { randomBytes } from './utils.js';
import { createWitnessProviders } from './witnesses.js';
class MemoryPrivateStateProvider {
    states = new Map();
    async get(key) {
        return this.states.get(key);
    }
    async set(key, value) {
        this.states.set(key, value);
    }
    async delete(key) {
        this.states.delete(key);
    }
}
export const createProvidersFromWallet = async (wallet, config) => {
    const walletConfig = await wallet.getConfiguration();
    const publicDataProvider = indexerPublicDataProvider(config.indexerUri, config.indexerWsUri);
    const privateStateProvider = new MemoryPrivateStateProvider();
    const zkConfigProvider = new FetchZkConfigProvider(config.zkConfigPath || `${config.indexerUri}/zk-config`, fetch);
    const proofProvider = httpClientProofProvider(config.proverServerUri, zkConfigProvider);
    const privateStateKey = 'shadow-market-private-state';
    let privateState = await privateStateProvider.get(privateStateKey);
    if (!privateState) {
        const secretKey = randomBytes(32);
        privateState = { userSecretKey: secretKey };
        await privateStateProvider.set(privateStateKey, privateState);
        console.log('Generated new user secret key');
    }
    const witnesses = createWitnessProviders(privateState);
    const walletProvider = {
        submitTransaction: async (tx) => {
            return await wallet.submitTransaction(tx);
        },
        getState: async () => {
            return await wallet.getConnectionStatus();
        },
    };
    const midnightProvider = {
        submitTransaction: walletProvider.submitTransaction,
        getState: walletProvider.getState,
    };
    return {
        publicDataProvider,
        privateStateProvider: privateStateProvider,
        zkConfigProvider: zkConfigProvider,
        proofProvider,
        midnightProvider: midnightProvider,
        walletProvider: walletProvider,
        witnesses,
    };
};
export const getOrCreatePrivateState = async (privateStateProvider) => {
    const privateStateKey = 'shadow-market-private-state';
    let privateState = (await privateStateProvider.get(privateStateKey));
    if (!privateState) {
        const secretKey = randomBytes(32);
        privateState = { userSecretKey: secretKey };
        await privateStateProvider.set(privateStateKey, privateState);
    }
    return privateState;
};
//# sourceMappingURL=providers.js.map