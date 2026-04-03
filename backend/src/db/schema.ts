import { relations } from 'drizzle-orm';
import {
  bigint,
  bigserial,
  boolean,
  decimal,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

// Enums
export const marketStatusEnum = pgEnum('market_status', [
  'OPEN',
  'LOCKED',
  'RESOLVED',
  'CANCELLED',
]);

export const wagerStatusEnum = pgEnum('wager_status', [
  'OPEN',
  'MATCHED',
  'CANCELLED',
  'SETTLED',
]);

export const categoryEnum = pgEnum('category', [
  'Politics',
  'Sports',
  'Crypto',
  'Finance',
  'Geopolitics',
  'Tech',
  'Culture',
  'Economy',
  'Weather',
  'Elections',
  'Others',
]);

// Users table
export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    address: varchar('address', { length: 255 }).unique().notNull(),
    publicKey: text('public_key'),
    username: varchar('username', { length: 255 }).unique(),
    email: varchar('email', { length: 255 }).unique(),
    avatar: text('avatar'),
    bio: text('bio'),

    // Wallet data (encrypted)
    encryptedSeed: text('encrypted_seed'),

    // Admin & moderation
    isAdmin: boolean('is_admin').default(false).notNull(),
    isBlocked: boolean('is_blocked').default(false).notNull(),

    // Stats
    totalVolume: decimal('total_volume', { precision: 20, scale: 0 }).default('0').notNull(),
    totalProfitLoss: decimal('total_profit_loss', { precision: 20, scale: 0 })
      .default('0')
      .notNull(),
    winRate: decimal('win_rate', { precision: 5, scale: 4 }).default('0').notNull(),
    reputation: integer('reputation').default(100).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    addressIdx: index('users_address_idx').on(table.address),
    usernameIdx: index('users_username_idx').on(table.username),
  })
);

// Markets table
export const markets = pgTable(
  'markets',
  {
    id: text('id').primaryKey(),
    onchainId: bigint('onchain_id', { mode: 'bigint' }).unique().notNull(),
    slug: varchar('slug', { length: 255 }).unique().notNull(),
    txHash: varchar('tx_hash', { length: 255 }),

    // Market config
    question: text('question').notNull(),
    description: text('description'),
    category: categoryEnum('category').notNull(),
    tags: json('tags').$type<string[]>().default([]).notNull(),

    // Timing
    createdAt: timestamp('created_at').defaultNow().notNull(),
    endTime: timestamp('end_time').notNull(),
    resolvedAt: timestamp('resolved_at'),

    // State
    status: marketStatusEnum('status').notNull(),
    outcome: integer('outcome'),

    // Metadata
    resolutionSource: text('resolution_source').notNull(),

    // Stats
    totalVolume: decimal('total_volume', { precision: 20, scale: 0 }).default('0').notNull(),
    totalPositions: integer('total_positions').default(0).notNull(),
    yesPrice: decimal('yes_price', { precision: 18, scale: 17 }).default('0.5').notNull(),
    noPrice: decimal('no_price', { precision: 18, scale: 17 }).default('0.5').notNull(),

    // Trending & engagement
    upvotes: integer('upvotes').default(0).notNull(),
    trendingScore: decimal('trending_score', { precision: 10, scale: 2 }).default('0').notNull(),
    volumeChange24h: decimal('volume_change_24h', { precision: 20, scale: 0 })
      .default('0')
      .notNull(),

    // Admin & moderation
    isFeatured: boolean('is_featured').default(false).notNull(),
    isVerified: boolean('is_verified').default(false).notNull(),
    reportCount: integer('report_count').default(0).notNull(),

    // Foreign keys
    creatorId: text('creator_id')
      .references(() => users.id)
      .notNull(),
  },
  table => ({
    statusIdx: index('markets_status_idx').on(table.status),
    categoryIdx: index('markets_category_idx').on(table.category),
    slugIdx: index('markets_slug_idx').on(table.slug),
    endTimeIdx: index('markets_end_time_idx').on(table.endTime),
    creatorIdx: index('markets_creator_idx').on(table.creatorId),
  })
);

// Positions table
export const positions = pgTable(
  'positions',
  {
    id: text('id').primaryKey(),
    onchainId: varchar('onchain_id', { length: 255 }).unique(),
    txHash: varchar('tx_hash', { length: 255 }),

    // Foreign keys
    userId: text('user_id')
      .references(() => users.id)
      .notNull(),
    marketId: text('market_id')
      .references(() => markets.id, { onDelete: 'cascade' })
      .notNull(),

    // Position data (ENCRYPTED for privacy)
    amountEncrypted: text('amount_encrypted').notNull(),
    sideEncrypted: text('side_encrypted').notNull(),
    nonceEncrypted: text('nonce_encrypted').notNull(),

    // On-chain commitment (public)
    commitment: text('commitment').notNull(),

    // Entry data
    entryPrice: decimal('entry_price', { precision: 18, scale: 17 }).notNull(),
    entryTimestamp: timestamp('entry_timestamp').defaultNow().notNull(),

    // Settlement
    isSettled: boolean('is_settled').default(false).notNull(),
    settledAt: timestamp('settled_at'),
    payout: decimal('payout', { precision: 20, scale: 0 }),
    profitLoss: decimal('profit_loss', { precision: 20, scale: 0 }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    userIdx: index('positions_user_idx').on(table.userId),
    marketIdx: index('positions_market_idx').on(table.marketId),
    settledIdx: index('positions_settled_idx').on(table.isSettled),
  })
);

// Wagers table (P2P)
export const wagers = pgTable(
  'wagers',
  {
    id: text('id').primaryKey(),
    onchainId: varchar('onchain_id', { length: 255 }).unique().notNull(),
    txHash: varchar('tx_hash', { length: 255 }),

    // P2P wager data
    creatorId: text('creator_id')
      .references(() => users.id)
      .notNull(),
    takerId: text('taker_id').references(() => users.id),
    marketId: text('market_id')
      .references(() => markets.id, { onDelete: 'cascade' })
      .notNull(),

    amount: decimal('amount', { precision: 20, scale: 0 }).notNull(),
    odds: json('odds').$type<[number, number]>().notNull(),
    creatorSide: varchar('creator_side', { length: 10 }).notNull(),

    status: wagerStatusEnum('status').notNull(),
    winner: varchar('winner', { length: 255 }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    matchedAt: timestamp('matched_at'),
    settledAt: timestamp('settled_at'),
  },
  table => ({
    statusIdx: index('wagers_status_idx').on(table.status),
    creatorIdx: index('wagers_creator_idx').on(table.creatorId),
    takerIdx: index('wagers_taker_idx').on(table.takerId),
    marketIdx: index('wagers_market_idx').on(table.marketId),
  })
);

// Price points table (for charting)
export const pricePoints = pgTable(
  'price_points',
  {
    id: text('id').primaryKey(),
    marketId: text('market_id')
      .references(() => markets.id, { onDelete: 'cascade' })
      .notNull(),

    timestamp: timestamp('timestamp').defaultNow().notNull(),
    yesPrice: decimal('yes_price', { precision: 18, scale: 17 }).notNull(),
    noPrice: decimal('no_price', { precision: 18, scale: 17 }).notNull(),
    volume: decimal('volume', { precision: 20, scale: 0 }).default('0').notNull(),
  },
  table => ({
    marketTimestampIdx: index('price_points_market_timestamp_idx').on(
      table.marketId,
      table.timestamp
    ),
  })
);


export const marketStats = pgTable(
  'market_stats',
  {
    id: text('id').primaryKey(),
    marketId: text('market_id')
      .references(() => markets.id, { onDelete: 'cascade' })
      .notNull(),

    totalVolume: decimal('total_volume', { precision: 20, scale: 0 }).default('0').notNull(),
    totalBets: integer('total_bets').default(0).notNull(),
    uniqueTraders: integer('unique_traders').default(0).notNull(),

    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    marketIdx: index('market_stats_market_idx').on(table.marketId),
  })
);

// Market upvotes
export const marketUpvotes = pgTable(
  'market_upvotes',
  {
    marketId: text('market_id')
      .references(() => markets.id, { onDelete: 'cascade' })
      .notNull(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => ({
    pk: index('market_upvotes_pk').on(table.marketId, table.userId),
    marketIdx: index('market_upvotes_market_idx').on(table.marketId),
    userIdx: index('market_upvotes_user_idx').on(table.userId),
  })
);

// Admin activity log
export const adminActivityLog = pgTable(
  'admin_activity_log',
  {
    id: text('id').primaryKey(),

    adminId: text('admin_id')
      .references(() => users.id)
      .notNull(),

    action: varchar('action', { length: 100 }).notNull(),
    targetType: varchar('target_type', { length: 50 }).notNull(),
    targetId: text('target_id').notNull(),
    details: json('details'),
    ipAddress: varchar('ip_address', { length: 50 }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => ({
    adminIdx: index('admin_activity_log_admin_idx').on(table.adminId),
    targetIdx: index('admin_activity_log_target_idx').on(table.targetType, table.targetId),
    createdAtIdx: index('admin_activity_log_created_at_idx').on(table.createdAt),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdMarkets: many(markets),
  positions: many(positions),
  createdWagers: many(wagers, { relationName: 'creator' }),
  takenWagers: many(wagers, { relationName: 'taker' }),
}));

export const marketsRelations = relations(markets, ({ one, many }) => ({
  creator: one(users, {
    fields: [markets.creatorId],
    references: [users.id],
  }),
  positions: many(positions),
  priceHistory: many(pricePoints),
  wagers: many(wagers),
  upvotedBy: many(marketUpvotes),
}));

export const positionsRelations = relations(positions, ({ one }) => ({
  user: one(users, {
    fields: [positions.userId],
    references: [users.id],
  }),
  market: one(markets, {
    fields: [positions.marketId],
    references: [markets.id],
  }),
}));

export const wagersRelations = relations(wagers, ({ one }) => ({
  creator: one(users, {
    fields: [wagers.creatorId],
    references: [users.id],
    relationName: 'creator',
  }),
  taker: one(users, {
    fields: [wagers.takerId],
    references: [users.id],
    relationName: 'taker',
  }),
  market: one(markets, {
    fields: [wagers.marketId],
    references: [markets.id],
  }),
}));

export const pricePointsRelations = relations(pricePoints, ({ one }) => ({
  market: one(markets, {
    fields: [pricePoints.marketId],
    references: [markets.id],
  }),
}));

export const marketUpvotesRelations = relations(marketUpvotes, ({ one }) => ({
  market: one(markets, {
    fields: [marketUpvotes.marketId],
    references: [markets.id],
  }),
  user: one(users, {
    fields: [marketUpvotes.userId],
    references: [users.id],
  }),
}));

export const adminActivityLogRelations = relations(adminActivityLog, ({ one }) => ({
  admin: one(users, {
    fields: [adminActivityLog.adminId],
    references: [users.id],
  }),
}));
