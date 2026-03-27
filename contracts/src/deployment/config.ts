import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Load environment configuration from .env file
 * Simple .env parser without external dependencies
 */
export function loadEnvConfig(): Record<string, string> {
  const envPath = path.resolve(__dirname, '..', '..', '.env');

  if (!fs.existsSync(envPath)) {
    console.warn('⚠️  No .env file found. Using defaults.');
    return {};
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const config: Record<string, string> = {};

  envContent.split('\n').forEach(line => {
    // Skip comments and empty lines
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    // Parse KEY=VALUE
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      config[key] = value;
    }
  });

  return config;
}

/**
 * Get admin wallet seed from environment
 */
export function getAdminWalletSeed(): string {
  const config = loadEnvConfig();
  const seed = config.ADMIN_WALLET_SEED || process.env.ADMIN_WALLET_SEED;

  if (!seed) {
    console.warn('⚠️  ADMIN_WALLET_SEED not set. Using genesis master wallet.');
    return '0000000000000000000000000000000000000000000000000000000000000001';
  }

  return seed;
}

/**
 * Get admin address for a specific contract
 * Returns empty if should be auto-derived from wallet
 */
export function getAdminAddress(contractType: 'oracle' | 'factory'): string | null {
  const config = loadEnvConfig();
  const envKey = contractType === 'oracle' ? 'ORACLE_ADMIN_ADDRESS' : 'FACTORY_ADMIN_ADDRESS';
  const address = config[envKey] || process.env[envKey];

  return address || null;
}

/**
 * Get private state password
 */
export function getPrivateStatePassword(): string {
  const config = loadEnvConfig();
  return config.PRIVATE_STATE_PASSWORD || process.env.PRIVATE_STATE_PASSWORD || 'dev-pw-x9k2m7n4q8';
}

/**
 * Check if contracts should be auto-initialized after deployment
 */
export function shouldAutoInitialize(): boolean {
  const config = loadEnvConfig();
  const value = config.AUTO_INITIALIZE_CONTRACTS || process.env.AUTO_INITIALIZE_CONTRACTS;
  return value === 'true';
}

/**
 * Get network configuration
 */
export interface NetworkConfig {
  network: string;
  indexer: string;
  indexerWS: string;
  proofServer: string;
  nodeUrl: string;
}

export function getNetworkConfig(): NetworkConfig {
  const config = loadEnvConfig();

  return {
    network: config.MIDNIGHT_NETWORK || process.env.MIDNIGHT_NETWORK || 'local',
    indexer:
      config.MIDNIGHT_INDEXER_URL ||
      process.env.MIDNIGHT_INDEXER_URL ||
      'http://127.0.0.1:8088/api/v3/graphql',
    indexerWS:
      config.MIDNIGHT_INDEXER_WS_URL ||
      process.env.MIDNIGHT_INDEXER_WS_URL ||
      'ws://127.0.0.1:8088/api/v3/graphql',
    proofServer:
      config.MIDNIGHT_PROOF_SERVER_URL ||
      process.env.MIDNIGHT_PROOF_SERVER_URL ||
      'http://127.0.0.1:6300',
    nodeUrl: config.MIDNIGHT_NODE_URL || process.env.MIDNIGHT_NODE_URL || 'ws://127.0.0.1:9944',
  };
}

/**
 * Derive admin key (Bytes<32>) from wallet address or seed
 * For now, returns a deterministic key based on seed
 */
export function deriveAdminKey(seed: string): Uint8Array {
  // Simple deterministic approach: hash the seed
  // In production, you'd use proper key derivation
  const buffer = Buffer.from(seed, 'hex');
  const key = new Uint8Array(32);

  // Use first 32 bytes of seed or repeat pattern
  for (let i = 0; i < 32; i++) {
    key[i] = buffer[i % buffer.length];
  }

  return key;
}
