import { sql } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from './client.js';

/**
 * Run database migrations from SQL files
 */
export async function runMigrations() {
  console.log('🔄 Running database migrations...');

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
        name: '001_admin_and_trending',
        path: join(process.cwd(), 'migrations', '001_admin_and_trending.sql'),
      },
    ];

    let ranCount = 0;

    for (const migration of migrations) {
      if (executedNames.has(migration.name)) {
        console.log(`  ⏭️  Skipping ${migration.name} (already executed)`);
        continue;
      }

      console.log(`  🔧 Running ${migration.name}...`);

      try {
        const migrationSQL = readFileSync(migration.path, 'utf-8');

        // Execute migration
        await db.execute(sql.raw(migrationSQL));

        // Record migration
        await db.execute(sql`INSERT INTO migrations (name) VALUES (${migration.name})`);

        console.log(`  ✅ Completed ${migration.name}`);
        ranCount++;
      } catch (error) {
        console.error(`  ❌ Failed ${migration.name}:`, error);
        throw error;
      }
    }

    if (ranCount === 0) {
      console.log('✅ All migrations up to date');
    } else {
      console.log(`✅ Ran ${ranCount} migration(s) successfully`);
    }

    return true;
  } catch (error) {
    console.error('❌ Migration error:', error);
    return false;
  }
}
