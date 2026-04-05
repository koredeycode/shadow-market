DO $$ BEGIN
 CREATE TYPE "category" AS ENUM('Politics', 'Sports', 'Crypto', 'Finance', 'Geopolitics', 'Tech', 'Culture', 'Economy', 'Weather', 'Elections', 'Others');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "market_status" AS ENUM('OPEN', 'LOCKED', 'RESOLVED', 'CANCELLED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "wager_status" AS ENUM('OPEN', 'MATCHED', 'CANCELLED', 'SETTLED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text NOT NULL,
	"action" varchar(100) NOT NULL,
	"target_type" varchar(50) NOT NULL,
	"target_id" text NOT NULL,
	"details" json,
	"ip_address" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bets" (
	"id" text PRIMARY KEY NOT NULL,
	"onchain_id" varchar(255),
	"tx_hash" varchar(255),
	"user_id" text NOT NULL,
	"market_id" text NOT NULL,
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
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bets_onchain_id_unique" UNIQUE("onchain_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "market_stats" (
	"id" text PRIMARY KEY NOT NULL,
	"market_id" text NOT NULL,
	"total_volume" numeric(20, 0) DEFAULT '0' NOT NULL,
	"total_bets" integer DEFAULT 0 NOT NULL,
	"unique_traders" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "market_upvotes" (
	"market_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
	"total_bets" integer DEFAULT 0 NOT NULL,
	"yes_price" numeric(18, 17) DEFAULT '0.5' NOT NULL,
	"no_price" numeric(18, 17) DEFAULT '0.5' NOT NULL,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"trending_score" numeric(10, 2) DEFAULT '0' NOT NULL,
	"volume_change_24h" numeric(20, 0) DEFAULT '0' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"report_count" integer DEFAULT 0 NOT NULL,
	"creator_id" text NOT NULL,
	CONSTRAINT "markets_onchain_id_unique" UNIQUE("onchain_id"),
	CONSTRAINT "markets_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "price_points" (
	"id" text PRIMARY KEY NOT NULL,
	"market_id" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"yes_price" numeric(18, 17) NOT NULL,
	"no_price" numeric(18, 17) NOT NULL,
	"volume" numeric(20, 0) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "terminal_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"pairing_code" varchar(12) NOT NULL,
	"token" text,
	"signature" text,
	"wallet_address" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"authorized_at" timestamp,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "terminal_sessions_pairing_code_unique" UNIQUE("pairing_code")
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wagers" (
	"id" text PRIMARY KEY NOT NULL,
	"onchain_id" varchar(255) NOT NULL,
	"tx_hash" varchar(255),
	"creator_id" text NOT NULL,
	"taker_id" text,
	"market_id" text NOT NULL,
	"amount" numeric(20, 0) NOT NULL,
	"odds" json NOT NULL,
	"creator_side" varchar(10) NOT NULL,
	"status" "wager_status" NOT NULL,
	"winner" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"matched_at" timestamp,
	"settled_at" timestamp,
	CONSTRAINT "wagers_onchain_id_unique" UNIQUE("onchain_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_activity_log_admin_idx" ON "admin_activity_log" ("admin_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_activity_log_target_idx" ON "admin_activity_log" ("target_type","target_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_activity_log_created_at_idx" ON "admin_activity_log" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bets_user_idx" ON "bets" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bets_market_idx" ON "bets" ("market_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bets_settled_idx" ON "bets" ("is_settled");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "market_stats_market_idx" ON "market_stats" ("market_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "market_upvotes_pk" ON "market_upvotes" ("market_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "market_upvotes_market_idx" ON "market_upvotes" ("market_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "market_upvotes_user_idx" ON "market_upvotes" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "markets_status_idx" ON "markets" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "markets_category_idx" ON "markets" ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "markets_slug_idx" ON "markets" ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "markets_end_time_idx" ON "markets" ("end_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "markets_creator_idx" ON "markets" ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "price_points_market_timestamp_idx" ON "price_points" ("market_id","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_address_idx" ON "users" ("address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_username_idx" ON "users" ("username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wagers_status_idx" ON "wagers" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wagers_creator_idx" ON "wagers" ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wagers_taker_idx" ON "wagers" ("taker_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wagers_market_idx" ON "wagers" ("market_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_activity_log" ADD CONSTRAINT "admin_activity_log_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bets" ADD CONSTRAINT "bets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bets" ADD CONSTRAINT "bets_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "market_stats" ADD CONSTRAINT "market_stats_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "market_upvotes" ADD CONSTRAINT "market_upvotes_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "market_upvotes" ADD CONSTRAINT "market_upvotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "markets" ADD CONSTRAINT "markets_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "price_points" ADD CONSTRAINT "price_points_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "terminal_sessions" ADD CONSTRAINT "terminal_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wagers" ADD CONSTRAINT "wagers_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wagers" ADD CONSTRAINT "wagers_taker_id_users_id_fk" FOREIGN KEY ("taker_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wagers" ADD CONSTRAINT "wagers_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
