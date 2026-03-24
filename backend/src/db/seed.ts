import { randomBytes } from 'crypto';
import { db } from './client';
import { markets, oracles, users } from './schema';

// Generate random ID
const generateId = () => randomBytes(16).toString('hex');

async function seed() {
  console.log('🌱 Seeding database...');

  try {
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

    console.log('✅ Created test users');

    // Create test oracles
    await db.insert(oracles).values([
      {
        id: generateId(),
        address: '0xoracle1' + randomBytes(20).toString('hex'),
        reputation: 900,
        totalSubmissions: 50,
        correctSubmissions: 48,
        status: 'ACTIVE',
        stake: '10000',
      },
      {
        id: generateId(),
        address: '0xoracle2' + randomBytes(20).toString('hex'),
        reputation: 850,
        totalSubmissions: 42,
        correctSubmissions: 39,
        status: 'ACTIVE',
        stake: '8000',
      },
    ]);

    console.log('✅ Created test oracles');

    // Create test markets
    const endTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    await db.insert(markets).values([
      {
        id: generateId(),
        onchainId: '1',
        contractAddress: '0xmarket1' + randomBytes(20).toString('hex'),
        question: 'Will Bitcoin reach $100,000 by end of 2026?',
        description:
          'This market resolves YES if Bitcoin (BTC) reaches or exceeds $100,000 USD on any major exchange by December 31, 2026.',
        marketType: 'BINARY',
        category: 'crypto',
        tags: ['bitcoin', 'crypto', 'price-prediction'],
        endTime,
        status: 'OPEN',
        resolutionSource: 'CoinGecko API',
        minBet: '1000',
        maxBet: '1000000',
        totalVolume: '0',
        totalLiquidity: '100000',
        yesPrice: '0.52',
        noPrice: '0.48',
        creatorId: alice.id,
      },
      {
        id: generateId(),
        onchainId: '2',
        contractAddress: '0xmarket2' + randomBytes(20).toString('hex'),
        question: 'Will Ethereum 3.0 launch in 2026?',
        description:
          'This market resolves YES if Ethereum officially launches version 3.0 of the protocol in 2026.',
        marketType: 'BINARY',
        category: 'crypto',
        tags: ['ethereum', 'technology', 'crypto'],
        endTime,
        status: 'OPEN',
        resolutionSource: 'Ethereum Foundation',
        minBet: '1000',
        maxBet: '500000',
        totalVolume: '0',
        totalLiquidity: '75000',
        yesPrice: '0.35',
        noPrice: '0.65',
        creatorId: bob.id,
      },
      {
        id: generateId(),
        onchainId: '3',
        contractAddress: '0xmarket3' + randomBytes(20).toString('hex'),
        question: 'Will AI surpass human performance in competitive programming by 2027?',
        description:
          'Resolves YES if an AI system achieves top 10% ranking in Codeforces or similar platform.',
        marketType: 'BINARY',
        category: 'technology',
        tags: ['artificial-intelligence', 'technology', 'programming'],
        endTime: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        status: 'OPEN',
        resolutionSource: 'Codeforces Rankings',
        minBet: '1000',
        maxBet: '750000',
        totalVolume: '0',
        totalLiquidity: '50000',
        yesPrice: '0.45',
        noPrice: '0.55',
        creatorId: carol.id,
      },
    ]);

    console.log('✅ Created test markets');

    console.log('🎉 Database seeding completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run seed
seed();
