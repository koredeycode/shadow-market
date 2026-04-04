// Test utilities and helpers

/**
 * Generate a test user with address and keys
 */
export function createTestUser(name: string) {
  return {
    name,
    address: `test-address-${name}`,
    secretKey: new Uint8Array(32).fill(0),
  };
}

/**
 * Generate a random nonce for testing
 */
export function randomNonce(): Uint8Array {
  const nonce = new Uint8Array(32);
  crypto.getRandomValues(nonce);
  return nonce;
}

/**
 * Create a test market configuration
 */
export function createTestMarket(overrides?: Partial<MarketConfig>) {
  return {
    question: 'Will BTC hit $100k by EOY?',
    marketType: 'BINARY',
    category: 'crypto',
    endTime: Date.now() + 86400000, // 24 hours
    resolutionSource: 'coinmarketcap',
    minBet: '1000',
    maxBet: '1000000',
    ...overrides,
  };
}

interface MarketConfig {
  question: string;
  marketType: string;
  category: string;
  endTime: number;
  resolutionSource: string;
  minBet: string;
  maxBet: string;
}

/**
 * Generate an oracle proof (mock for testing)
 */
export function generateOracleProof(outcome: number): Uint8Array {
  const proof = new Uint8Array(32);
  proof[0] = outcome;
  return proof;
}

/**
 * Fast forward time in tests
 */
export function timeTravelTo(timestamp: number) {
  // Mock implementation for testing
  // In actual tests, this would manipulate the test environment
  return timestamp;
}
