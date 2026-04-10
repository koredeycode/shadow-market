import { sql } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { join } from 'path';
import logger from '../utils/logger.js';
import { db } from './client.js';

/**
 * Run database migrations from SQL files
 */
export async function runMigrations() {
  logger.info('Running database migrations...');

  try {
    // Check if migrations table exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Get executed migrations
    const executed = await db.execute(sql`SELECT name FROM migrations`);
    const executedNames = new Set(executed.rows.map((row: any) => row.name));

    // Migration files to run
    const migrations = [
      {
        name: '000_bootstrap',
        path: join(process.cwd(), 'migrations', '000_bootstrap.sql'),
      },
      {
        name: '001_admin_and_trending',
        path: join(process.cwd(), 'migrations', '001_admin_and_trending.sql'),
      },
    ];

    let ranCount = 0;

    for (const migration of migrations) {
      if (executedNames.has(migration.name)) {
        logger.debug('Skipping migration (already executed)', { migration: migration.name });
        continue;
      }

      logger.info('Running migration', { migration: migration.name });

      try {
        const migrationSQL = readFileSync(migration.path, 'utf-8');

        // Execute migration
        await db.execute(sql.raw(migrationSQL));

        // Record migration
        await db.execute(sql`INSERT INTO migrations (name) VALUES (${migration.name})`);

        logger.info('Migration completed successfully', { migration: migration.name });
        ranCount++;
      } catch (error) {
        logger.error('Migration failed', { migration: migration.name, error });
        throw error;
      }
    }

    if (ranCount === 0) {
      logger.info('All migrations up to date');
    } else {
      logger.info('Migrations completed', { count: ranCount });
    }

    return true;
  } catch (error) {
    logger.error('Migration error', { error });
    return false;
  }
}
