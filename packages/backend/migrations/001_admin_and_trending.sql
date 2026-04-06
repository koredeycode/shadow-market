-- Safe migration for admin and trending columns
-- Added if not already handled by initial drizzle migrations

DO $$ 
BEGIN
    -- users.is_admin
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_admin') THEN
        ALTER TABLE "users" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;
    END IF;

    -- markets.trending_score
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='markets' AND column_name='trending_score') THEN
        ALTER TABLE "markets" ADD COLUMN "trending_score" numeric(10, 2) DEFAULT '0' NOT NULL;
    END IF;

    -- markets.upvotes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='markets' AND column_name='upvotes') THEN
        ALTER TABLE "markets" ADD COLUMN "upvotes" integer DEFAULT 0 NOT NULL;
    END IF;

    -- markets.volume_change_24h
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='markets' AND column_name='volume_change_24h') THEN
        ALTER TABLE "markets" ADD COLUMN "volume_change_24h" numeric(20, 0) DEFAULT '0' NOT NULL;
    END IF;

    -- markets.is_featured
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='markets' AND column_name='is_featured') THEN
        ALTER TABLE "markets" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;
    END IF;

    -- markets.is_verified
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='markets' AND column_name='is_verified') THEN
        ALTER TABLE "markets" ADD COLUMN "is_verified" boolean DEFAULT false NOT NULL;
    END IF;
END $$;
