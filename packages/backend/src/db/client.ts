import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import logger from '../utils/logger.js';
import * as schema from './schema.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase.com') ? { rejectUnauthorized: false } : undefined,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased for remote DB
});

export const db = drizzle(pool, { schema });

// Helper to close pool on shutdown
export const closeDb = async () => {
  await pool.end();
};

// Test connection
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    client.release();
    logger.info('Database connection successful', {
      maxConnections: 20,
      database: process.env.DATABASE_URL?.split('@')[1]?.split('/')[1] || 'unknown',
    });
    return true;
  } catch (error) {
    logger.error('Database connection failed', { error });
    return false;
  }
};
