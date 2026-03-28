import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { compiledShadowMarketContract, ledger as contractLedger } from '@shadow-market/contracts';
import { map } from 'rxjs';
import { createProvidersFromWallet, getOrCreatePrivateState, } from './providers.js';
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
            return {
                ledger,
                isInitialized: ledger.isInitialized > 0n,
                marketCount: ledger.marketCount,
                wagerCount: ledger.wagerCount,
            };
        }));
        console.log('ShadowMarketAPI connected to contract:', this.deployedContractAddress);
    }
    async initialize() {
        console.log('INITIALIZING CONTRACT ON-CHAIN');
        try {
            const txData = await this.deployedContract.callTx.initialize();
            console.log('Contract initialized! Transaction:', txData.public.txHash);
        }
        catch (error) {
            console.error('initialize circuit execution failed:', error);
            throw new Error(`Failed to initialize contract: ${error.message}`);
        }
    }
    async placeBet(marketId, betAmount, betOutcome) {
        console.log(`PLACING BET ON-CHAIN: market=${marketId}, amount=${betAmount}, side=${betOutcome ? 'YES' : 'NO'}`);
        try {
            const txData = await this.deployedContract.callTx.placeBet(BigInt(marketId), betOutcome ? 1n : 0n);
            console.log('Bet placed! Transaction:', txData.public.txHash);
        }
        catch (error) {
            console.error('placeBet circuit execution failed:', error);
            throw new Error(`Failed to place bet: ${error.message}`);
        }
    }
    async claimWinnings(betId) {
        console.log(`CLAIMING POOL WINNINGS ON-CHAIN: betId=${betId}`);
        try {
            const txData = await this.deployedContract.callTx.claimPoolWinnings(BigInt(betId));
            console.log('Winnings claimed! Transaction:', txData.public.txHash);
        }
        catch (error) {
            console.error('claimPoolWinnings circuit execution failed:', error);
            throw new Error(`Failed to claim winnings: ${error.message}`);
        }
    }
    async addLiquidity(marketId, amount) {
        throw new Error('addLiquidity circuit not available in Shadow Market contract');
    }
    async removeLiquidity(marketId, lpTokenAmount) {
        throw new Error('removeLiquidity circuit not available in Shadow Market contract');
    }
    async createMarket(question, resolutionTime, initialLiquidity, oracleAddress) {
        console.log(`CREATING MARKET ON-CHAIN: ${question}, endTime=${resolutionTime}`);
        try {
            const txData = await this.deployedContract.callTx.createMarket(resolutionTime, initialLiquidity);
            console.log('Market created! Transaction:', txData.public.txHash);
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
        }
        catch (error) {
            console.error('lockMarket circuit execution failed:', error);
            throw new Error(`Failed to lock market: ${error.message}`);
        }
    }
    async resolveMarket(marketId, outcome) {
        console.log(`RESOLVING MARKET ON-CHAIN: ${marketId}, outcome=${outcome ? 'YES' : 'NO'}`);
        try {
            const txData = await this.deployedContract.callTx.resolveMarket(BigInt(marketId), outcome ? 1n : 0n);
            console.log('Market resolved! Transaction:', txData.public.txHash);
        }
        catch (error) {
            console.error('resolveMarket circuit execution failed:', error);
            throw new Error(`Failed to resolve market: ${error.message}`);
        }
    }
    async createWager(marketId, side, oddsNumerator, oddsDenominator) {
        console.log(`CREATING P2P WAGER ON-CHAIN: market=${marketId}`);
        try {
            const txData = await this.deployedContract.callTx.createWager(BigInt(marketId), side ? 1n : 0n, oddsNumerator, oddsDenominator);
            console.log('Wager created! Transaction:', txData.public.txHash);
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
        }
        catch (error) {
            console.error('cancelWager circuit execution failed:', error);
            throw new Error(`Failed to cancel wager: ${error.message}`);
        }
    }
    async claimWagerWinnings(wagerId) {
        console.log(`CLAIMING WAGER WINNINGS ON-CHAIN: ${wagerId}`);
        try {
            const txData = await this.deployedContract.callTx.claimWagerWinnings(BigInt(wagerId));
            console.log('Wager winnings claimed! Transaction:', txData.public.txHash);
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
    static async connect(wallet, config) {
        console.log('Connecting to Shadow Market contract...');
        try {
            const providers = await createProvidersFromWallet(wallet, config);
            const privateState = await getOrCreatePrivateState(providers.privateStateProvider);
            console.log('Providers and private state initialized');
            if (!config.contractAddress) {
                throw new Error('Contract address required for connection');
            }
            const deployedContract = (await findDeployedContract(providers, {
                compiledContract: compiledShadowMarketContract,
                contractAddress: config.contractAddress,
                privateStateId: 'shadow-market-private-state',
                initialPrivateState: privateState,
            }));
            console.log('Found deployed contract at:', deployedContract.deployTxData.public.contractAddress);
            return new ShadowMarketAPI(deployedContract, providers, privateState);
        }
        catch (error) {
            console.error('Failed to connect to contract:', error);
            throw new Error(`Contract connection failed: ${error.message}`);
        }
    }
}
export { createProvidersFromWallet, getOrCreatePrivateState } from './providers.js';
export { createWitnessProviders } from './witnesses.js';
//# sourceMappingURL=index.js.map