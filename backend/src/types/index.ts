// Market types
export type MarketStatus = 'OPEN' | 'LOCKED' | 'RESOLVED' | 'CANCELLED';

// Wager types
export type WagerStatus = 'OPEN' | 'MATCHED' | 'CANCELLED' | 'SETTLED';

// Oracle types
export type OracleStatus = 'ACTIVE' | 'SUSPENDED' | 'REMOVED';
export type ReportStatus = 'PENDING' | 'DISPUTED' | 'CONFIRMED';

// Request/Response types
export interface CreateMarketRequest {
  question: string;
  description?: string;
  category: string;
  tags?: string[];
  endTime: Date;
  resolutionSource: string;
  onchainId?: string;
  txHash?: string;
}

export interface PlaceBetRequest {
  marketId: string;
  amount: string;
  side: 'yes' | 'no';
  slippage?: number;
  txHash?: string;
  onchainId?: string;
}

export interface CreateP2PWagerRequest {
  marketId: string;
  amount: string;
  odds: [number, number];
  side: 'yes' | 'no';
  duration: number;
  txHash?: string;
  onchainId?: string;
}

export interface SubmitOracleReportRequest {
  marketId: string;
  outcome: number;
  confidence: number;
  proofData: string;
}

export interface MarketFilters {
  status?: MarketStatus;
  category?: string;
  tags?: string[];
  sortBy?: 'volume' | 'ending_soon' | 'newest';
  limit?: number;
  offset?: number;
}

export interface PortfolioStats {
  totalValue: string;
  totalProfitLoss: string;
  winRate: number;
  activePositions: number;
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  averageBetSize: string;
  totalVolume: string;
}

export interface PricePoint {
  timestamp: number;
  yesPrice: string;
  noPrice: string;
  volume: string;
}

// Decrypted position data (only for authorized user)
export interface DecryptedPosition {
  id: string;
  marketId: string;
  marketSlug: string;
  marketQuestion: string;
  amount: string;
  side: 'yes' | 'no';
  entryPrice: string;
  currentValue: string;
  profitLoss: string;
  isSettled: boolean;
  entryTimestamp: Date;
  settledAt?: Date;
  payout?: string;
}

export interface Portfolio {
  activePositions: DecryptedPosition[];
  settledPositions: DecryptedPosition[];
  stats: PortfolioStats;
}

// WebSocket events
export interface WebSocketEvents {
  // Client -> Server
  'subscribe:market': { marketId: string };
  'subscribe:user': { userId: string };
  'unsubscribe:market': { marketId: string };

  // Server -> Client
  'market:update': {
    marketId: string;
    yesPrice: string;
    noPrice: string;
    totalVolume: string;
    timestamp: number;
  };
  'market:resolved': {
    marketId: string;
    outcome: number;
    timestamp: number;
  };
  'position:update': {
    marketId: string;
    value: string;
    profitLoss: string;
  };
  'wager:matched': {
    wagerId: string;
    taker: string;
  };
}

// API Response wrappers
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
