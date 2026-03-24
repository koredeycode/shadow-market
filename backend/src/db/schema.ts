import {
  pgTable,
  text,
  varchar,
  timestamp,
  decimal,
  integer,
  boolean,
  json,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const marketTypeEnum = pgEnum('market_type', [
  'BINARY',
  'CATEGORICAL',
  'SCALAR',
]);

export const marketStatusEnum = pgEnum('market_status', [
  'PENDING',
  'OPEN',
  'LOCKED',
  'RESOLVED',
  'CANCELLED',
]);

export const wagerStatusEnum = pgEnum('wager_status', [
  'OPEN',
  'MATCHED',
  'RESOLVED',
  'CANCELLED',
]);

export const reportStatusEnum = pgEnum('report_status', [
  'PENDING',
  'DISPUTED',
  'CONFIRMED',
]);

export const oracleStatusEnum = pgEnum('oracle_status', [
  'ACTIVE',
  'SUSPENDED',
  'REMOVED',
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

    // Stats
    totalVolume: decimal('total_volume', { precision: 20, scale: 0 })
      .default('0')
      .notNull(),
    totalProfitLoss: decimal('total_profit_loss', { precision: 20, scale: 0 })
      .default('0')
      .notNull(),
    winRate: decimal('win_rate', { precision: 5, scale: 4 }).default('0').notNull(),
    reputation: integer('reputation').default(100).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    addressIdx: index('users_address_idx').on(table.address),
    usernameIdx: index('users_username_idx').on(table.username),
  })
);

// Markets table
export const markets = pgTable(
  'markets',
  {
    id: text('id').primaryKey(),
    onchainId: varchar('onchain_id', { length: 255 }).unique().notNull(),
    contractAddress: varchar('contract_address', { length: 255 }).unique().notNull(),

    // Market config
    question: text('question').notNull(),
    description: text('description'),
    marketType: marketTypeEnum('market_type').notNull(),
    category: varchar('category', { length: 100 }).notNull(),
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
    minBet: decimal('min_bet', { precision: 20, scale: 0 }).notNull(),
    maxBet: decimal('max_bet', { precision: 20, scale: 0 }).notNull(),

    // Stats
    totalVolume: decimal('total_volume', { precision: 20, scale: 0 })
      .default('0')
      .notNull(),
    totalLiquidity: decimal('total_liquidity', { precision: 20, scale: 0 })
      .default('0')
      .notNull(),
    totalPositions: integer('total_positions').default(0).notNull(),
    yesPrice: decimal('yes_price', { precision: 18, scale: 17 })
      .default('0.5')
      .notNull(),
    noPrice: decimal('no_price', { precision: 18, scale: 17 })
      .default('0.5')
      .notNull(),

    // Foreign keys
    creatorId: text('creator_id')
      .references(() => users.id)
      .notNull(),
  },
  (table) => ({
    statusIdx: index('markets_status_idx').on(table.status),
    categoryIdx: index('markets_category_idx').on(table.category),
    endTimeIdx: index('markets_end_time_idx').on(table.endTime),
    creatorIdx: index('markets_creator_idx').on(table.creatorId),
  })
);

// Positions table
export const positions = pgTable(
  'positions',
  {
    id: text('id').primaryKey(),

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
  (table) => ({
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
  (table) => ({
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
  (table) => ({
    marketTimestampIdx: index('price_points_market_timestamp_idx').on(
      table.marketId,
      table.timestamp
    ),
  })
);

// Oracle information
export const oracles = pgTable(
  'oracles',
  {
    id: text('id').primaryKey(),
    address: varchar('address', { length: 255 }).unique().notNull(),

    // Oracle data
    reputation: integer('reputation').default(500).notNull(),
    totalSubmissions: integer('total_submissions').default(0).notNull(),
    correctSubmissions: integer('correct_submissions').default(0).notNull(),
    status: oracleStatusEnum('status').notNull(),
    stake: decimal('stake', { precision: 20, scale: 0 }).notNull(),

    registeredAt: timestamp('registered_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    addressIdx: index('oracles_address_idx').on(table.address),
    statusIdx: index('oracles_status_idx').on(table.status),
  })
);

// Oracle reports table
export const oracleReports = pgTable(
  'oracle_reports',
  {
    id: text('id').primaryKey(),

    reporterId: text('reporter_id')
      .references(() => oracles.id)
      .notNull(),
    marketId: text('market_id')
      .references(() => markets.id, { onDelete: 'cascade' })
      .notNull(),

    outcome: integer('outcome').notNull(),
    confidence: integer('confidence').notNull(),
    proofData: text('proof_data').notNull(),

    status: reportStatusEnum('status').notNull(),
    confirmations: integer('confirmations').default(1).notNull(),
    disputes: integer('disputes').default(0).notNull(),

    reportedAt: timestamp('reported_at').defaultNow().notNull(),
    confirmedAt: timestamp('confirmed_at'),
  },
  (table) => ({
    marketIdx: index('oracle_reports_market_idx').on(table.marketId),
    reporterIdx: index('oracle_reports_reporter_idx').on(table.reporterId),
    statusIdx: index('oracle_reports_status_idx').on(table.status),
  })
);

// Liquidity pools
export const liquidityPools = pgTable(
  'liquidity_pools',
  {
    id: text('id').primaryKey(),
    onchainId: varchar('onchain_id', { length: 255 }).unique().notNull(),
    marketId: text('market_id')
      .references(() => markets.id, { onDelete: 'cascade' })
      .notNull(),

    yesReserve: decimal('yes_reserve', { precision: 20, scale: 0 }).notNull(),
    noReserve: decimal('no_reserve', { precision: 20, scale: 0 }).notNull(),
    totalLiquidity: decimal('total_liquidity', { precision: 20, scale: 0 }).notNull(),
    totalLpTokens: decimal('total_lp_tokens', { precision: 20, scale: 0 }).notNull(),
    feeRate: integer('fee_rate').notNull(),

    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    marketIdx: index('liquidity_pools_market_idx').on(table.marketId),
  })
);

// LP positions
export const lpPositions = pgTable(
  'lp_positions',
  {
    id: text('id').primaryKey(),

    userId: text('user_id')
      .references(() => users.id)
      .notNull(),
    poolId: text('pool_id')
      .references(() => liquidityPools.id, { onDelete: 'cascade' })
      .notNull(),

    lpTokens: decimal('lp_tokens', { precision: 20, scale: 0 }).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userPoolIdx: index('lp_positions_user_pool_idx').on(table.userId, table.poolId),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdMarkets: many(markets),
  positions: many(positions),
  createdWagers: many(wagers, { relationName: 'creator' }),
  takenWagers: many(wagers, { relationName: 'taker' }),
  lpPositions: many(lpPositions),
}));

export const marketsRelations = relations(markets, ({ one, many }) => ({
  creator: one(users, {
    fields: [markets.creatorId],
    references: [users.id],
  }),
  positions: many(positions),
  priceHistory: many(pricePoints),
  wagers: many(wagers),
  reports: many(oracleReports),
  liquidityPool: one(liquidityPools),
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

export const oraclesRelations = relations(oracles, ({ many }) => ({
  reports: many(oracleReports),
}));

export const oracleReportsRelations = relations(oracleReports, ({ one }) => ({
  reporter: one(oracles, {
    fields: [oracleReports.reporterId],
    references: [oracles.id],
  }),
  market: one(markets, {
    fields: [oracleReports.marketId],
    references: [markets.id],
  }),
}));

export const liquidityPoolsRelations = relations(liquidityPools, ({ one, many }) => ({
  market: one(markets, {
    fields: [liquidityPools.marketId],
    references: [markets.id],
  }),
  lpPositions: many(lpPositions),
}));

export const lpPositionsRelations = relations(lpPositions, ({ one }) => ({
  user: one(users, {
    fields: [lpPositions.userId],
    references: [users.id],
  }),
  pool: one(liquidityPools, {
    fields: [lpPositions.poolId],
    references: [liquidityPools.id],
  }),
}));
