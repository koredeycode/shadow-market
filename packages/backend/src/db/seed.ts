import { randomBytes } from 'crypto';
import { sql } from 'drizzle-orm';
import 'dotenv/config';
import { db } from './client.js';
import {
  markets,
  positions,
  pricePoints,
  users,
  wagers,
  adminActivityLog,
  marketStats,
  marketUpvotes,
} from './schema.js';

// Generate random ID
const generateId = () => randomBytes(16).toString('hex');

export async function clearDatabase() {
  console.log('Force-clearing database schema...');
  // Drop all tables to reset the schema entirely
  const tables = [
    'price_points',
    'wagers',
    'positions',
    'market_stats',
    'market_upvotes',
    'admin_activity_log',
    'markets',
    'users',
    'drizzle_migrations' // Ensure we clear migration tracking
  ];

  for (const table of tables) {
    try {
      await db.execute(sql`DROP TABLE IF EXISTS ${sql.identifier(table)} CASCADE`);
    } catch (e) {
      console.warn(`Failed to drop table ${table}:`, e);
    }
  }
  
  // Also drop the enums if they exist
  const enums = ['category', 'market_status', 'wager_status', 'oracle_status', 'report_status'];
  for (const enumName of enums) {
    try {
      await db.execute(sql`DROP TYPE IF EXISTS ${sql.identifier(enumName)} CASCADE`);
    } catch (e) {
      console.warn(`Failed to drop enum ${enumName}:`, e);
    }
  }

  console.log('Database schema force-cleared');
}

// Slug generation utility
const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');

async function seed() {
  console.log('Seeding database...');

  try {
    // Clear existing data
    await clearDatabase();

    const usedSlugs = new Set<string>();
    const generateUniqueSlug = (text: string) => {
      let slug = slugify(text);
      if (!usedSlugs.has(slug)) {
        usedSlugs.add(slug);
        return slug;
      }
      let counter = 1;
      let newSlug = `${slug}-${counter}`;
      while (usedSlugs.has(newSlug)) {
        counter++;
        newSlug = `${slug}-${counter}`;
      }
      usedSlugs.add(newSlug);
      return newSlug;
    };

    // Create test users
    const [alice, bob, carol] = await db
      .insert(users)
      .values([
        {
          id: generateId(),
          address: '0xalice' + randomBytes(20).toString('hex'),
          username: 'alice',
          email: 'alice@shadowmarket.com',
          reputation: 150,
        },
        {
          id: generateId(),
          address: '0xbob' + randomBytes(20).toString('hex'),
          username: 'bob',
          email: 'bob@shadowmarket.com',
          reputation: 120,
        },
        {
          id: generateId(),
          address: '0xcarol' + randomBytes(20).toString('hex'),
          username: 'carol',
          email: 'carol@shadowmarket.com',
          reputation: 180,
        },
      ])
      .returning();

    console.log('Created test users');

    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    const categories = ['Crypto', 'Politics', 'Tech', 'Finance', 'Sports', 'Science', 'Culture', 'BioTech'];
    const tagsMap: Record<string, string[]> = {
      'Crypto': ['bitcoin', 'ethereum', 'cardano', 'solana', 'defi'],
      'Politics': ['election', 'usa', 'policy', 'geopolitics'],
      'Tech': ['ai', 'apple', 'space', 'robotics', 'software'],
      'Finance': ['fed', 'stocks', 'oil', 'macro'],
      'Sports': ['nba', 'soccer', 'nfl', 'tennis'],
      'Science': ['climate', 'astronomy', 'biology'],
      'Culture': ['music', 'movies', 'art'],
      'BioTech': ['health', 'genetics', 'pharmaceuticals']
    };

    const marketTemplates = [
      'Will {item} reach {value} by {date}?',
      'Who will win the {event} {year}?',
      'Will {company} release {product} in {year}?',
      'Will {topic} be {status} before {date}?',
      'Predict the outcome of {event} on {date}.'
    ];

    const items = ['Bitcoin', 'Ethereum', 'Cardano', 'OpenAI', 'Apple', 'Tesla', 'SpaceX', 'Federal Reserve', 'S&P 500', 'Crude Oil'];
    const values = ['$100k', '$10k', '$5.00', 'GPT-6', 'Vision Pro 2', 'Mars Mission', 'Rate Cut', 'New Highs', 'FDA Approval'];

    const seedMarkets = [];
    for (let i = 1; i <= 50; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const item = items[Math.floor(Math.random() * items.length)];
      const value = values[Math.floor(Math.random() * values.length)];
      const question = `Market Question #${i}: Will ${item} hit ${value} in 2026?`;
      
      seedMarkets.push({
        id: generateId(),
        onchainId: BigInt(i),
        slug: generateUniqueSlug(question),
        question: question,
        description: `This is a detailed description for market #${i}. It resolves based on public data.`,
        category: (category === 'Science' || category === 'BioTech') ? 'Others' : category, // Map to existing enums
        tags: tagsMap[category] || ['general'],
        endTime: i % 2 === 0 ? nextMonth : nextYear,
        status: 'OPEN',
        resolutionSource: 'Public Data Oracle',
        totalVolume: (Math.random() * 50000000).toFixed(0),
        yesPrice: (0.1 + Math.random() * 0.8).toFixed(2),
        noPrice: '0.00', // Will be calculated
        creatorId: [alice.id, bob.id, carol.id][i % 3],
      });
      
      // Fix noPrice
      seedMarkets[seedMarkets.length - 1].noPrice = (1 - parseFloat(seedMarkets[seedMarkets.length - 1].yesPrice)).toFixed(2);
    }

    await db.insert(markets).values(seedMarkets as any);

    console.log('Created test markets');
    console.log('Database seeding completed!');
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  }
}

// Export for programmatic use
export { seed };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed().catch(error => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
}
