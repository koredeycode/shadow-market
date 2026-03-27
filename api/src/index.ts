/**
 * Shadow Market API Wrapper
 * Provides a clean interface to the unified prediction market contract
 * Following the BBoard architectural pattern
 *
 * ⚠️  NOTE: This is a stub implementation awaiting contract compilation.
 *
 * The Midnight SDK v4 has significant API changes from v3.
 * Once the unified-prediction-market contract is compiled and bindings are generated,
 * this API layer needs to be implemented following the pattern in BBoard example.
 *
 * To complete:
 * 1. Run: pnpm contracts:compile
 * 2. Import the generated contract bindings from contracts/src/managed/
 * 3. Use @midnight-ntwrk/midnight-js-contracts deployContract() or findDeployedContract()
 * 4. Set up providers: publicDataProvider, privateStateProvider, proofProvider
 * 5. Implement contract calls via deployedContract.callTx.*
 */

/**
 * Configuration for the unified market contract
 */
export interface DeployedUnifiedMarketConfig {
  contractAddress: string;
  networkId: string;
  indexerUrl: string;
  indexerWs?: string;
  proofServerUrl: string;
  nodeUrl: string;
}

/**
 * Unified Market API Interface
 */
export interface DeployedUnifiedMarketAPI {
  placeBet(marketId: string, betAmount: bigint, betOutcome: boolean, wallet: any): Promise<void>;
  createMarket(
    marketId: string,
    questionHash: Uint8Array,
    resolverAddress: string,
    endTime: bigint,
    wallet: any
  ): Promise<void>;
  lockMarket(marketId: string, wallet: any): Promise<void>;
  resolveMarket(marketId: string, outcome: boolean, wallet: any): Promise<void>;
  claimPoolWinnings(marketId: string, wallet: any): Promise<void>;
  createWager(
    wagerId: string,
    questionHash: Uint8Array,
    makerStake: bigint,
    takerStake: bigint,
    makerPrediction: boolean,
    expiryTime: bigint,
    wallet: any
  ): Promise<void>;
  acceptWager(wagerId: string, wallet: any): Promise<void>;
  resolveWager(wagerId: string, outcome: boolean, wallet: any): Promise<void>;
  cancelWager(wagerId: string, wallet: any): Promise<void>;
  claimWagerWinnings(wagerId: string, wallet: any): Promise<void>;
  state(): Promise<any>;
}

/**
 * Stub API class - To be implemented after contract compilation
 */
export class UnifiedMarketAPI implements DeployedUnifiedMarketAPI {
  constructor(_config: DeployedUnifiedMarketConfig) {
    console.log('⚠️  UnifiedMarketAPI (STUB MODE) - Contract needs to be compiled');
  }

  async placeBet(
    marketId: string,
    betAmount: bigint,
    betOutcome: boolean,
    _wallet: any
  ): Promise<void> {
    console.log(`API (stub): placeBet(${marketId}, ${betAmount}, ${betOutcome})`);
    throw new Error('Contract not compiled. Run: pnpm contracts:compile');
  }

  async createMarket(
    marketId: string,
    _questionHash: Uint8Array,
    _resolverAddress: string,
    _endTime: bigint,
    _wallet: any
  ): Promise<void> {
    console.log(`API (stub): createMarket(${marketId})`);
    throw new Error('Contract not compiled');
  }

  async lockMarket(marketId: string, _wallet: any): Promise<void> {
    console.log(`API (stub): lockMarket(${marketId})`);
    throw new Error('Contract not compiled');
  }

  async resolveMarket(marketId: string, outcome: boolean, _wallet: any): Promise<void> {
    console.log(`API (stub): resolveMarket(${marketId}, ${outcome})`);
    throw new Error('Contract not compiled');
  }

  async claimPoolWinnings(marketId: string, _wallet: any): Promise<void> {
    console.log(`API (stub): claimPoolWinnings(${marketId})`);
    throw new Error('Contract not compiled');
  }

  async createWager(
    wagerId: string,
    _questionHash: Uint8Array,
    _makerStake: bigint,
    _takerStake: bigint,
    _makerPrediction: boolean,
    _expiryTime: bigint,
    _wallet: any
  ): Promise<void> {
    console.log(`API (stub): createWager(${wagerId})`);
    throw new Error('Contract not compiled');
  }

  async acceptWager(wagerId: string, _wallet: any): Promise<void> {
    console.log(`API (stub): acceptWager(${wagerId})`);
    throw new Error('Contract not compiled');
  }

  async resolveWager(wagerId: string, outcome: boolean, _wallet: any): Promise<void> {
    console.log(`API (stub): resolveWager(${wagerId}, ${outcome})`);
    throw new Error('Contract not compiled');
  }

  async cancelWager(wagerId: string, _wallet: any): Promise<void> {
    console.log(`API (stub): cancelWager(${wagerId})`);
    throw new Error('Contract not compiled');
  }

  async claimWagerWinnings(wagerId: string, _wallet: any): Promise<void> {
    console.log(`API (stub): claimWagerWinnings(${wagerId})`);
    throw new Error('Contract not compiled');
  }

  async state(): Promise<any> {
    console.log('API (stub): state()');
    throw new Error('Contract not compiled');
  }
}
