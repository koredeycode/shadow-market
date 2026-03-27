-- Migration: Add admin features, trending, and upvoting
-- Date: 2024
-- Description: Adds admin fields to users, trending/upvote fields to markets, and new tables

-- Add admin and KYC fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE NOT NULL;

-- Create KYC status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE kyc_status AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status kyc_status DEFAULT 'NONE' NOT NULL;

-- Add trending and engagement fields to markets table
ALTER TABLE markets ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS trending_score DECIMAL(10, 2) DEFAULT 0 NOT NULL;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS volume_change_24h DECIMAL(20, 0) DEFAULT 0 NOT NULL;

-- Add admin and moderation fields to markets table
ALTER TABLE markets ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0 NOT NULL;

-- Create market upvotes table
CREATE TABLE IF NOT EXISTS market_upvotes (
    market_id TEXT NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    PRIMARY KEY (market_id, user_id)
);

CREATE INDEX IF NOT EXISTS market_upvotes_market_idx ON market_upvotes(market_id);
CREATE INDEX IF NOT EXISTS market_upvotes_user_idx ON market_upvotes(user_id);

-- Create admin activity log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id TEXT NOT NULL,
    details JSON,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS admin_activity_log_admin_idx ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS admin_activity_log_target_idx ON admin_activity_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS admin_activity_log_created_at_idx ON admin_activity_log(created_at);

-- Create indexes for new market fields
CREATE INDEX IF NOT EXISTS markets_trending_score_idx ON markets(trending_score DESC);
CREATE INDEX IF NOT EXISTS markets_upvotes_idx ON markets(upvotes DESC);
CREATE INDEX IF NOT EXISTS markets_featured_idx ON markets(is_featured);
CREATE INDEX IF NOT EXISTS markets_verified_idx ON markets(is_verified);

-- Create index for user admin status
CREATE INDEX IF NOT EXISTS users_is_admin_idx ON users(is_admin);
CREATE INDEX IF NOT EXISTS users_is_blocked_idx ON users(is_blocked);
