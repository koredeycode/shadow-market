-- Full Shadow Market Schema Bootstrap
-- Initial Enums
DO $$ BEGIN
    CREATE TYPE "market_status" AS ENUM ('OPEN', 'LOCKED', 'RESOLVED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "wager_status" AS ENUM ('OPEN', 'MATCHED', 'CANCELLED', 'SETTLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "category" AS ENUM ('Politics', 'Sports', 'Crypto', 'Finance', 'Geopolitics', 'Tech', 'Culture', 'Economy', 'Weather', 'Elections', 'Others');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Core Tables
CREATE TABLE IF NOT EXISTS "users" (
    "id" text PRIMARY KEY NOT NULL,
    "address" varchar(255) NOT NULL,
    "public_key" text,
    "username" varchar(255),
    "email" varchar(255),
    "avatar" text,
    "bio" text,
    "encrypted_seed" text,
    "is_admin" boolean DEFAULT false NOT NULL,
    "is_blocked" boolean DEFAULT false NOT NULL,
    "total_volume" numeric(20, 0) DEFAULT '0' NOT NULL,
    "total_profit_loss" numeric(20, 0) DEFAULT '0' NOT NULL,
    "win_rate" numeric(5, 4) DEFAULT '0' NOT NULL,
    "reputation" integer DEFAULT 100 NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "users_address_unique" UNIQUE("address"),
    CONSTRAINT "users_username_unique" UNIQUE("username"),
    CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "markets" (
    "id" text PRIMARY KEY NOT NULL,
    "onchain_id" bigint NOT NULL,
    "slug" varchar(255) NOT NULL,
    "tx_hash" varchar(255),
    "question" text NOT NULL,
    "description" text,
    "category" "category" NOT NULL,
    "tags" json DEFAULT '[]'::json NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "end_time" timestamp NOT NULL,
    "resolved_at" timestamp,
    "status" "market_status" NOT NULL,
    "outcome" integer,
    "resolution_source" text NOT NULL,
    "total_volume" numeric(20, 0) DEFAULT '0' NOT NULL,
    "total_yes_volume" numeric(20, 0) DEFAULT '0' NOT NULL,
    "total_no_volume" numeric(20, 0) DEFAULT '0' NOT NULL,
    "total_bets" integer DEFAULT 0 NOT NULL,
    "yes_price" numeric(18, 17) DEFAULT '0.5' NOT NULL,
    "no_price" numeric(18, 17) DEFAULT '0.5' NOT NULL,
    "upvotes" integer DEFAULT 0 NOT NULL,
    "trending_score" numeric(10, 2) DEFAULT '0' NOT NULL,
    "volume_change_24h" numeric(20, 0) DEFAULT '0' NOT NULL,
    "is_featured" boolean DEFAULT false NOT NULL,
    "is_verified" boolean DEFAULT false NOT NULL,
    "report_count" integer DEFAULT 0 NOT NULL,
    "creator_id" text NOT NULL REFERENCES "users"("id"),
    CONSTRAINT "markets_onchain_id_unique" UNIQUE("onchain_id"),
    CONSTRAINT "markets_slug_unique" UNIQUE("slug")
);

CREATE TABLE IF NOT EXISTS "bets" (
    "id" text PRIMARY KEY NOT NULL,
    "onchain_id" varchar(255) UNIQUE,
    "tx_hash" varchar(255),
    "user_id" text NOT NULL REFERENCES "users"("id"),
    "market_id" text NOT NULL REFERENCES "markets"("id") ON DELETE CASCADE,
    "amount_encrypted" text NOT NULL,
    "side_encrypted" text NOT NULL,
    "nonce_encrypted" text NOT NULL,
    "commitment" text NOT NULL,
    "entry_price" numeric(18, 17) NOT NULL,
    "entry_timestamp" timestamp DEFAULT now() NOT NULL,
    "is_settled" boolean DEFAULT false NOT NULL,
    "settled_at" timestamp,
    "payout" numeric(20, 0),
    "profit_loss" numeric(20, 0),
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "wagers" (
    "id" text PRIMARY KEY NOT NULL,
    "onchain_id" varchar(255) NOT NULL UNIQUE,
    "tx_hash" varchar(255),
    "creator_id" text NOT NULL REFERENCES "users"("id"),
    "taker_id" text REFERENCES "users"("id"),
    "market_id" text NOT NULL REFERENCES "markets"("id") ON DELETE CASCADE,
    "amount" numeric(20, 0) NOT NULL,
    "odds" json NOT NULL,
    "creator_side" varchar(10) NOT NULL,
    "status" "wager_status" NOT NULL,
    "winner" varchar(255),
    "created_at" timestamp DEFAULT now() NOT NULL,
    "expires_at" timestamp NOT NULL,
    "matched_at" timestamp,
    "settled_at" timestamp
);

CREATE TABLE IF NOT EXISTS "price_points" (
    "id" text PRIMARY KEY NOT NULL,
    "market_id" text NOT NULL REFERENCES "markets"("id") ON DELETE CASCADE,
    "timestamp" timestamp DEFAULT now() NOT NULL,
    "yes_price" numeric(18, 17) NOT NULL,
    "no_price" numeric(18, 17) NOT NULL,
    "volume" numeric(20, 0) DEFAULT '0' NOT NULL
);

CREATE TABLE IF NOT EXISTS "market_stats" (
    "id" text PRIMARY KEY NOT NULL,
    "market_id" text NOT NULL REFERENCES "markets"("id") ON DELETE CASCADE,
    "total_volume" numeric(20, 0) DEFAULT '0' NOT NULL,
    "total_bets" integer DEFAULT 0 NOT NULL,
    "unique_traders" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "market_upvotes" (
    "market_id" text NOT NULL REFERENCES "markets"("id") ON DELETE CASCADE,
    "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "admin_activity_log" (
    "id" text PRIMARY KEY NOT NULL,
    "admin_id" text NOT NULL REFERENCES "users"("id"),
    "action" varchar(100) NOT NULL,
    "target_type" varchar(50) NOT NULL,
    "target_id" text NOT NULL,
    "details" json,
    "ip_address" varchar(50),
    "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "terminal_sessions" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text REFERENCES "users"("id"),
    "status" varchar(20) DEFAULT 'PENDING' NOT NULL,
    "pairing_code" varchar(12) NOT NULL UNIQUE,
    "token" text,
    "signature" text,
    "wallet_address" varchar(255) NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "authorized_at" timestamp,
    "expires_at" timestamp NOT NULL
);

-- Basic Indexes
CREATE INDEX IF NOT EXISTS "users_address_idx" ON "users" ("address");
CREATE INDEX IF NOT EXISTS "markets_status_idx" ON "markets" ("status");
CREATE INDEX IF NOT EXISTS "markets_category_idx" ON "markets" ("category");
CREATE INDEX IF NOT EXISTS "bets_user_idx" ON "bets" ("user_id");
CREATE INDEX IF NOT EXISTS "wagers_status_idx" ON "wagers" ("status");
