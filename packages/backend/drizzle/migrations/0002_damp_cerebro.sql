ALTER TABLE "markets" ADD COLUMN "total_yes_volume" numeric(20, 0) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "markets" ADD COLUMN "total_no_volume" numeric(20, 0) DEFAULT '0' NOT NULL;