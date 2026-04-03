DO $$ BEGIN
 CREATE TYPE "category" AS ENUM('Politics', 'Sports', 'Crypto', 'Finance', 'Geopolitics', 'Tech', 'Culture', 'Economy', 'Weather', 'Elections', 'Others');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "wager_status" ADD VALUE 'SETTLED';--> statement-breakpoint
ALTER TABLE "market_stats" ALTER COLUMN "market_id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "market_upvotes" ALTER COLUMN "market_id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "markets" ALTER COLUMN "id" SET DATA TYPE bigserial;--> statement-breakpoint
ALTER TABLE "markets" ALTER COLUMN "onchain_id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "markets" ALTER COLUMN "category" SET DATA TYPE category;--> statement-breakpoint
ALTER TABLE "positions" ALTER COLUMN "market_id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "price_points" ALTER COLUMN "market_id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "wagers" ALTER COLUMN "market_id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "markets" ADD COLUMN "slug" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "positions" ADD COLUMN "onchain_id" varchar(255);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "markets_slug_idx" ON "markets" ("slug");--> statement-breakpoint
ALTER TABLE "markets" DROP COLUMN IF EXISTS "min_bet";--> statement-breakpoint
ALTER TABLE "markets" DROP COLUMN IF EXISTS "max_bet";--> statement-breakpoint
ALTER TABLE "markets" DROP COLUMN IF EXISTS "total_liquidity";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "kyc_status";--> statement-breakpoint
ALTER TABLE "markets" ADD CONSTRAINT "markets_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_onchain_id_unique" UNIQUE("onchain_id");