import { Transaction } from '@midnight-ntwrk/ledger-v8';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { fromHex, randomBytes, toHex } from './utils.js';
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
    setContractAddress(address) {
        console.log(`Private state provider scoped to contract: ${address}`);
    }
    async getSigningKey(address) {
        return this.states.get(`signing-key-${address}`);
    }
    async setSigningKey(address, key) {
        this.states.set(`signing-key-${address}`, key);
    }
}
export const createProvidersFromWallet = async (wallet, config) => {
    let statusCallback;
    const graphqlUri = config.indexerUri.endsWith('/graphql') ? config.indexerUri : `${config.indexerUri}/graphql`;
    const graphqlWsUri = config.indexerWsUri.endsWith('/graphql/ws') ? config.indexerWsUri : `${config.indexerWsUri}/graphql/ws`;
    const publicDataProvider = indexerPublicDataProvider(graphqlUri, graphqlWsUri);
    const privateStateProvider = new MemoryPrivateStateProvider();
    const baseIndexerUri = config.indexerUri.replace(/\/graphql$/, '');
    const zkConfigProvider = new FetchZkConfigProvider(config.zkConfigPath || `${baseIndexerUri}/zk-config`, fetch);
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
    const balanceTx_original = async (tx, ttl) => {
        const txHex = toHex(tx.serialize());
        const balanced = await wallet.balanceUnsealedTransaction(txHex);
        return fromHex(balanced.tx);
    };
    const balanceTx_v3 = async (tx, ttl) => {
        const txBytes = tx.serialize();
        const startTime = performance.now();
        try {
            if (typeof wallet.balanceUnsealedTransaction !== 'function') {
                throw new Error('Wallet does not support balanceUnsealedTransaction');
            }
            console.log(`[v3 WORKAROUND] Initiated for unsealed transaction (${txBytes.length} bytes)`);
            if (statusCallback)
                statusCallback('CLEANING');
            console.log('[v3 WORKAROUND] Step 1: Cleaning transaction state...');
            const cleanTx = Transaction.deserialize('signature', 'proof', 'pre-binding', txBytes);
            if (statusCallback)
                statusCallback('SERIALIZING');
            const cleanTxHex = toHex(cleanTx.serialize());
            console.log(`[v3 WORKAROUND] Step 2: Serialized to hex (Length: ${cleanTxHex.length})`);
            if (statusCallback)
                statusCallback('BALANCING_START');
            console.log('[v3 WORKAROUND] Step 3: Calling wallet.balanceUnsealedTransaction... (STUCK HERE?)');
            const balancingPromise = wallet.balanceUnsealedTransaction(cleanTxHex);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Balancing timeout (60s) reached - the wallet may have crashed or locked up internally')), 60000));
            const balanced = await Promise.race([balancingPromise, timeoutPromise]);
            const duration = ((performance.now() - startTime) / 1000).toFixed(2);
            if (statusCallback)
                statusCallback('BALANCING_END', { duration });
            console.log(`[v3 WORKAROUND] Step 4: Balancing successful. Duration: ${duration}s. Deserializing result...`);
            const result = fromHex(balanced.tx);
            console.log('[v3 WORKAROUND] complete.');
            return result;
        }
        catch (error) {
            console.error('Balancing phase (v3) failed or timed out:', error);
            throw error;
        }
    };
    const walletProvider = {
        balanceTx: balanceTx_v3,
        balanceTx_legacy: balanceTx_original,
        getCoinPublicKey: () => config.shieldedCoinPublicKey,
        getEncryptionPublicKey: () => config.shieldedEncryptionPublicKey,
    };
    const midnightProvider = {
        submitTx: async (tx) => {
            console.log('Submitting finalized transaction to wallet...');
            const txBytes = tx;
            const txHex = toHex(txBytes);
            try {
                await wallet.submitTransaction(txHex);
                const txObj = Transaction.deserialize('signature', 'proof', 'binding', txBytes);
                const txId = txObj.identifiers()[0];
                return txId;
            }
            catch (error) {
                console.error('Transaction submission failed:', error);
                throw error;
            }
        },
    };
    return {
        publicDataProvider,
        privateStateProvider: privateStateProvider,
        zkConfigProvider: zkConfigProvider,
        proofProvider,
        midnightProvider: midnightProvider,
        walletProvider: walletProvider,
        witnesses,
        onStatusUpdate: (cb) => { statusCallback = cb; }
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