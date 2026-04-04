import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..', '..');

// Load environment files in priority order: .env.local > .env.NODE_ENV > .env
const nodeEnv = process.env.NODE_ENV || 'development';
const envFiles = [
  path.join(rootDir, '.env'),
  path.join(rootDir, `.env.${nodeEnv}`),
  path.join(rootDir, '.env.local')
];

for (const file of envFiles) {
  if (fs.existsSync(file)) {
    dotenv.config({ path: file, override: true });
  }
}

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || 'localhost',

  // Database
  databaseUrl: process.env.DATABASE_URL!,

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // Session
  sessionSecret: process.env.SESSION_SECRET!,

  // JWT
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Encryption
  encryptionKey: process.env.ENCRYPTION_KEY!,

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Midnight Network
  networkId: process.env.MIDNIGHT_NETWORK_ID || process.env.NETWORK_ID || 'undeployed',
  nodeUrl: process.env.MIDNIGHT_NODE_URL || process.env.NODE_URL || 'http://localhost:9944',
  indexerUrl: process.env.MIDNIGHT_INDEXER_URL || process.env.INDEXER_URL || 'http://localhost:8088/api/v4/graphql',
  indexerWs: process.env.MIDNIGHT_INDEXER_WS || process.env.INDEXER_WS || 'ws://localhost:8088/api/v4/graphql/ws',
  proofServerUrl: process.env.MIDNIGHT_PROOF_SERVER_URL || process.env.PROOF_SERVER_URL || 'http://localhost:6300',

  // Contract addresses
  shadowMarketContractAddress:
    process.env.MIDNIGHT_SHADOW_MARKET_CONTRACT_ADDRESS ||
    process.env.MIDNIGHT_UNIFIED_CONTRACT_ADDRESS ||
    process.env.UNIFIED_CONTRACT_ADDRESS,

  // Admin Configuration
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'changeme',
  adminAddress: process.env.ADMIN_ADDRESS || process.env.ADMIN_WALLET_ADDRESS || '',
  adminSeed: process.env.ADMIN_SEED || '',
};

// Validate required config
const required = ['databaseUrl', 'sessionSecret', 'jwtSecret', 'encryptionKey'];

for (const key of required) {
  if (!config[key as keyof typeof config]) {
    throw new Error(`Missing required config: ${key}`);
  }
}
