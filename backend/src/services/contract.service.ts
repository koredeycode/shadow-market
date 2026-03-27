// Contract service stub - awaiting contract compilation and SDK v4 integration
// The unified contract integration will be implemented after:
// 1. Contract is compiled (pnpm contracts:compile)
// 2. API package wrapper is completed
// 3. Backend wallet integration is set up

/**
 * Unified prediction market contract service for backend admin operations
 *
 * NOTE: This is a stub implementation. To enable:
 * - Compile contracts: pnpm contracts:compile
 * - Complete API wrapper in api/src/index.ts
 * - Set up admin wallet provider
 */
export class UnifiedContractService {
  constructor() {
    console.log('⚠️  Contract service (STUB MODE) - awaiting contract compilation');
  }

  /**
   * Initialize contract connection
   */
  async initialize() {
    console.log('Contract service stub initialized');
    // Will use api package once contract is compiled
  }

  /**
   * Lock a market (admin only)
   */
  async lockMarket(marketId: string): Promise<void> {
    console.log(`Contract (stub): lockMarket(${marketId})`);
    throw new Error('Contract not compiled. Admin operations use database only.');
  }

  /**
   * Resolve a market with outcome (admin only)
   */
  async resolveMarket(marketId: string, outcome: boolean): Promise<void> {
    console.log(`Contract (stub): resolveMarket(${marketId}, ${outcome})`);
    throw new Error('Contract not compiled. Admin operations use database only.');
  }

  /**
   * Get ledger state (read-only)
   */
  async getLedgerState(): Promise<any | null> {
    return null;
  }

  /**
   * Get market statistics from contract
   */
  async getMarketStats(marketId: string): Promise<{
    yesTotal: bigint;
    noTotal: bigint;
    betCount: bigint;
  } | null> {
    console.log(`Contract (stub): getMarketStats(${marketId})`);
    return null;
  }
}

// Export singleton instance
export const unifiedContract = new UnifiedContractService();
