import dotenv from 'dotenv';

dotenv.config();

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
  networkId: process.env.NETWORK_ID || 'undeployed',
  nodeUrl: process.env.NODE_URL || 'http://localhost:9944',
  indexerUrl: process.env.INDEXER_URL || 'http://localhost:8088/api/v3/graphql',
  indexerWs: process.env.INDEXER_WS || 'ws://localhost:8088/api/v3/graphql/ws',
  proofServerUrl: process.env.PROOF_SERVER_URL || 'http://localhost:6300',

  // Contract addresses
  marketFactoryAddress: process.env.MARKET_FACTORY_ADDRESS || '',
  predictionMarketAddress: process.env.PREDICTION_MARKET_ADDRESS || '',
  p2pWagerAddress: process.env.P2P_WAGER_ADDRESS || '',
  liquidityPoolAddress: process.env.LIQUIDITY_POOL_ADDRESS || '',
  oracleAddress: process.env.ORACLE_ADDRESS || '',
  unifiedContractAddress:
    process.env.UNIFIED_CONTRACT_ADDRESS ||
    'cd9dae0f85be015b6b6c6b4008de30fc0be98d55bbf6b61f0fbda0e359f9aea7',

  // Admin user (created on startup)
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'changeme',
  adminWalletAddress: process.env.ADMIN_WALLET_ADDRESS || '',
};

// Validate required config
const required = ['databaseUrl', 'sessionSecret', 'jwtSecret', 'encryptionKey'];

for (const key of required) {
  if (!config[key as keyof typeof config]) {
    throw new Error(`Missing required config: ${key}`);
  }
}
