ALTER TABLE "market_stats" ALTER COLUMN "market_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "market_upvotes" ALTER COLUMN "market_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "markets" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "positions" ALTER COLUMN "market_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "price_points" ALTER COLUMN "market_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "wagers" ALTER COLUMN "market_id" SET DATA TYPE text;