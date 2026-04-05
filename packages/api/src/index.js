import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { compiledShadowMarketContract, ledger as contractLedger } from '@shadow-market/contracts';
import { map, shareReplay } from 'rxjs';
import { createProvidersFromWallet, getOrCreatePrivateState, } from './providers.js';
import { stringToBytes32 } from './utils.js';
import { setBetContext, setWagerAmount } from './witnesses.js';
export class ShadowMarketAPI {
    deployedContract;
    providers;
    privateState;
    state$;
    deployedContractAddress;
    constructor(deployedContract, providers, privateState) {
        this.deployedContract = deployedContract;
        this.providers = providers;
        this.privateState = privateState;
        this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
        this.state$ = providers.publicDataProvider
            .contractStateObservable(this.deployedContractAddress, { type: 'latest' })
            .pipe(map(contractState => {
            const ledger = contractLedger(contractState.data);
            this.latestLedger = ledger;
            console.log('[DEBUG] ShadowMarketAPI: Ledger state update received:', {
                isInitialized: ledger.isInitialized.toString(),
                marketCount: ledger.marketCount.toString(),
                wagerCount: ledger.wagerCount.toString(),
                betCount: ledger.betCount.toString()
            });
            return {
                ledger,
                isInitialized: ledger.isInitialized > 0n,
                marketCount: ledger.marketCount,
                wagerCount: ledger.wagerCount,
                betCount: ledger.betCount,
            };
        }), shareReplay(1));
        console.log('ShadowMarketAPI connected to contract:', this.deployedContractAddress);
    }
    setStatusCallback(cb) {
        if (this.providers.onStatusUpdate && typeof this.providers.onStatusUpdate === 'function') {
            this.providers.onStatusUpdate(cb);
        }
    }
    latestLedger = null;
    getOnChainMarket(marketId) {
        if (!this.latestLedger)
            return null;
        try {
            return this.latestLedger.markets.lookup(marketId);
        }
        catch (e) {
            return null;
        }
    }
    getOnChainWager(wagerId) {
        if (!this.latestLedger)
            return null;
        try {
            return this.latestLedger.wagers.lookup(wagerId);
        }
        catch (e) {
            return null;
        }
    }
    getOnChainBet(betId) {
        if (!this.latestLedger)
            return null;
        try {
            return this.latestLedger.bets.lookup(betId);
        }
        catch (e) {
            return null;
        }
    }
    async initialize() {
        console.log('INITIALIZING CONTRACT ON-CHAIN');
        try {
            const initializeFn = this.deployedContract.callTx.initialize;
            const txData = await initializeFn();
            console.log('Contract initialized! Transaction:', txData.public.txHash);
            return txData.public.txHash;
        }
        catch (error) {
            console.error('initialize circuit execution failed:', error);
            throw new Error(`Failed to initialize contract: ${error.message}`);
        }
    }
    async placeBet(marketId, betAmount, betOutcome) {
        console.log(`PLACING BET ON-CHAIN: market=${marketId}, amount=${betAmount}, side=${betOutcome ? 'YES' : 'NO'}`);
        try {
            const outcomeEnum = betOutcome ? 2 : 1;
            setBetContext(betAmount, outcomeEnum);
            const txData = await this.deployedContract.callTx.placeBet(BigInt(marketId), outcomeEnum);
            console.log('Bet placed! Transaction:', txData.public.txHash);
            console.log('DEBUG: Full txData response:', JSON.stringify(txData, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
            const onchainId = this.getDisclosedId(txData);
            console.log('Disclosed Bet ID:', onchainId);
            return { txHash: txData.public.txHash, onchainId };
        }
        catch (error) {
            console.error('placeBet circuit execution failed:', error);
            throw new Error(`Failed to place bet: ${error.message}`);
        }
    }
    async claimWinnings(betId) {
        console.log(`CLAIMING POOL WINNINGS ON-CHAIN: betId=${betId}`);
        try {
            const userAddress = this.providers.walletProvider.getCoinPublicKey();
            const txData = await this.deployedContract.callTx.claimPoolWinnings(BigInt(betId), userAddress);
            console.log('Winnings claimed! Transaction:', txData.public.txHash);
            return txData.public.txHash;
        }
        catch (error) {
            console.error('claimPoolWinnings circuit execution failed:', error);
            throw new Error(`Failed to claim winnings: ${error.message}`);
        }
    }
    async createMarket(question, resolutionTime) {
        console.log(`CREATING MARKET ON-CHAIN: ${question}, endTime=${resolutionTime}`);
        try {
            const titleBytes = stringToBytes32(question);
            const createMarketFn = this.deployedContract.callTx.createMarket;
            const txData = await createMarketFn(resolutionTime, titleBytes);
            console.log('DEBUG: Full txData response:', JSON.stringify(txData, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
            const onchainId = this.getDisclosedId(txData);
            console.log('Disclosed Market ID:', onchainId);
            return { txHash: txData.public.txHash, onchainId };
        }
        catch (error) {
            console.error('createMarket circuit execution failed:', error);
            throw new Error(`Failed to create market: ${error.message}`);
        }
    }
    async lockMarket(marketId) {
        console.log(`LOCKING MARKET ON-CHAIN: ${marketId}`);
        try {
            const txData = await this.deployedContract.callTx.lockMarket(BigInt(marketId));
            console.log('Market locked! Transaction:', txData.public.txHash);
            return txData.public.txHash;
        }
        catch (error) {
            console.error('lockMarket circuit execution failed:', error);
            throw new Error(`Failed to lock market: ${error.message}`);
        }
    }
    async resolveMarket(marketId, outcome) {
        console.log(`RESOLVING MARKET ON-CHAIN: ${marketId}, outcome=${outcome ? 'YES' : 'NO'}`);
        try {
            const outcomeEnum = outcome ? 2 : 1;
            const txData = await this.deployedContract.callTx.resolveMarket(BigInt(marketId), outcomeEnum);
            console.log('Market resolved! Transaction:', txData.public.txHash);
            return txData.public.txHash;
        }
        catch (error) {
            console.error('resolveMarket circuit execution failed:', error);
            throw new Error(`Failed to resolve market: ${error.message}`);
        }
    }
    async createWager(marketId, side, amount, oddsNumerator, oddsDenominator) {
        console.log(`CREATING P2P WAGER ON-CHAIN: market=${marketId}, amount=${amount}`);
        try {
            setWagerAmount(amount);
            const outcomeEnum = side ? 2 : 1;
            const txData = await this.deployedContract.callTx.createWager(BigInt(marketId), outcomeEnum, oddsNumerator, oddsDenominator);
            console.log('Wager created! Transaction:', txData.public.txHash);
            console.log('DEBUG: Full txData response:', JSON.stringify(txData, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
            const onchainId = this.getDisclosedId(txData);
            console.log('Disclosed Wager ID:', onchainId);
            return { txHash: txData.public.txHash, onchainId };
        }
        catch (error) {
            console.error('createWager circuit execution failed:', error);
            throw new Error(`Failed to create wager: ${error.message}`);
        }
    }
    async acceptWager(wagerId) {
        console.log(`ACCEPTING WAGER ON-CHAIN: ${wagerId}`);
        try {
            const txData = await this.deployedContract.callTx.acceptWager(BigInt(wagerId));
            console.log('Wager accepted! Transaction:', txData.public.txHash);
            return txData.public.txHash;
        }
        catch (error) {
            console.error('acceptWager circuit execution failed:', error);
            throw new Error(`Failed to accept wager: ${error.message}`);
        }
    }
    async cancelWager(wagerId) {
        console.log(`CANCELING WAGER ON-CHAIN: ${wagerId}`);
        try {
            const txData = await this.deployedContract.callTx.cancelWager(BigInt(wagerId));
            console.log('Wager cancelled! Transaction:', txData.public.txHash);
            return txData.public.txHash;
        }
        catch (error) {
            console.error('cancelWager circuit execution failed:', error);
            throw new Error(`Failed to cancel wager: ${error.message}`);
        }
    }
    async claimWagerWinnings(wagerId) {
        console.log(`CLAIMING WAGER WINNINGS ON-CHAIN: ${wagerId}`);
        try {
            const userAddress = this.providers.walletProvider.getCoinPublicKey();
            const txData = await this.deployedContract.callTx.claimWagerWinnings(BigInt(wagerId), userAddress);
            console.log('Wager winnings claimed! Transaction:', txData.public.txHash);
            return txData.public.txHash;
        }
        catch (error) {
            console.error('claimWagerWinnings circuit execution failed:', error);
            throw new Error(`Failed to claim wager winnings: ${error.message}`);
        }
    }
    getContractAddress() {
        return this.deployedContractAddress;
    }
    subscribeToState(callback) {
        return this.state$.subscribe(callback);
    }
    static async connectWithProviders(providers, contractAddress) {
        console.log('Connecting to Shadow Market contract with existing providers...');
        if (typeof providers.privateStateProvider.setContractAddress === 'function') {
            providers.privateStateProvider.setContractAddress(contractAddress);
        }
        const privateState = await getOrCreatePrivateState(providers.privateStateProvider);
        const compiledWithWitnesses = compiledShadowMarketContract.pipe(CompiledContract.withWitnesses(providers.witnesses));
        const deployedContract = (await findDeployedContract(providers, {
            compiledContract: compiledWithWitnesses,
            contractAddress,
            privateStateId: 'shadow-market-private-state',
            initialPrivateState: privateState,
        }));
        return new ShadowMarketAPI(deployedContract, providers, privateState);
    }
    static async connect(wallet, config) {
        console.log('Connecting to Shadow Market contract via wallet...');
        setNetworkId(config.networkId);
        try {
            const providers = await createProvidersFromWallet(wallet, config);
            if (!config.contractAddress) {
                throw new Error('Contract address required for connection');
            }
            return await ShadowMarketAPI.connectWithProviders(providers, config.contractAddress);
        }
        catch (error) {
            console.error('Failed to connect to contract:', error);
            throw new Error(`Contract connection failed: ${error.message}`);
        }
    }
    getDisclosedId(txData) {
        console.log('DEBUG: >>> START DISCLOSED ID EXTRACTION <<<');
        const result = txData.result ?? txData.public?.result;
        if (result !== undefined && result !== null) {
            const val = this.extractValue(result);
            if (val !== null && val !== undefined && val.toString() !== '') {
                console.log('DEBUG: Found ID in circuit return value:', val.toString());
                return val.toString();
            }
        }
        const disclosed = txData.public?.disclosed ?? txData.disclosed;
        if (Array.isArray(disclosed) && disclosed.length > 0) {
            const val = this.extractValue(disclosed[disclosed.length - 1]);
            if (val !== null) {
                console.log('DEBUG: Found ID in disclosed array pool:', val.toString());
                return val.toString();
            }
        }
        console.warn('CRITICAL: No ID found in circuit result. The system may have been unable to identify the new entity ID.');
        return '';
    }
    extractValue(val) {
        if (val === null || val === undefined)
            return null;
        if (val instanceof Uint8Array || (typeof val === 'object' && val.constructor?.name === 'Uint8Array')) {
            if (val.length === 0)
                return null;
            if (val.length <= 8) {
                let res = 0n;
                for (let i = 0; i < val.length; i++)
                    res = (res << 8n) | BigInt(val[i]);
                return res;
            }
            return Array.from(val).map((b) => b.toString(16).padStart(2, '0')).join('');
        }
        if (Array.isArray(val)) {
            if (val.length === 0)
                return null;
            if (val.length === 1)
                return this.extractValue(val[0]);
            return val.map(v => this.extractValue(v)).filter(v => v !== null);
        }
        if (typeof val === 'object') {
            if ('value' in val)
                return this.extractValue(val.value);
            if ('tag' in val && 'value' in val)
                return this.extractValue(val.value);
            if ('0' in val && Object.keys(val).length === 1)
                return this.extractValue(val['0']);
        }
        return val;
    }
}
export { createProvidersFromWallet, getOrCreatePrivateState } from './providers.js';
export { createWitnessProviders } from './witnesses.js';
//# sourceMappingURL=index.js.map