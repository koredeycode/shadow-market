-- Add indexes for better query performance

-- Markets table indexes
CREATE INDEX IF NOT EXISTS idx_markets_status ON markets(status);
CREATE INDEX IF NOT EXISTS idx_markets_category ON markets(category);
CREATE INDEX IF NOT EXISTS idx_markets_end_time ON markets(end_time);
CREATE INDEX IF NOT EXISTS idx_markets_creator_id ON markets(creator_id);
CREATE INDEX IF NOT EXISTS idx_markets_created_at ON markets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_markets_total_volume ON markets(total_volume DESC);

-- Positions table indexes
CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_market_id ON positions(market_id);
CREATE INDEX IF NOT EXISTS idx_positions_is_settled ON positions(is_settled);
CREATE INDEX IF NOT EXISTS idx_positions_user_market ON positions(user_id, market_id);

-- Wagers table indexes
CREATE INDEX IF NOT EXISTS idx_wagers_creator_id ON wagers(creator_id);
CREATE INDEX IF NOT EXISTS idx_wagers_taker_id ON wagers(taker_id);
CREATE INDEX IF NOT EXISTS idx_wagers_market_id ON wagers(market_id);
CREATE INDEX IF NOT EXISTS idx_wagers_status ON wagers(status);
CREATE INDEX IF NOT EXISTS idx_wagers_expires_at ON wagers(expires_at);

-- Price points table indexes
CREATE INDEX IF NOT EXISTS idx_price_points_market_id ON price_points(market_id);
CREATE INDEX IF NOT EXISTS idx_price_points_timestamp ON price_points(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_price_points_market_time ON price_points(market_id, timestamp DESC);

-- Oracle reports table indexes
CREATE INDEX IF NOT EXISTS idx_oracle_reports_market_id ON oracle_reports(market_id);
CREATE INDEX IF NOT EXISTS idx_oracle_reports_reporter_id ON oracle_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_oracle_reports_status ON oracle_reports(status);

-- Users table indexes (if not already created)
CREATE INDEX IF NOT EXISTS idx_users_address ON users(address);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_reputation ON users(reputation DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_markets_status_category ON markets(status, category);
CREATE INDEX IF NOT EXISTS idx_markets_status_end_time ON markets(status, end_time);
CREATE INDEX IF NOT EXISTS idx_positions_user_settled ON positions(user_id, is_settled);
