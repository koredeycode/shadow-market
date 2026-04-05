export type MarketStatus = 'PENDING' | 'OPEN' | 'LOCKED' | 'RESOLVED' | 'CANCELLED';

export interface Market {
  id: string;
  onchainId: string;
  slug: string;
  contractAddress: string;
  question: string;
  description?: string;
  category: string;
  tags: string[];
  createdAt: string;
  endTime: string;
  resolvedAt?: string;
  status: MarketStatus;
  outcome?: number;
  resolutionSource: string;
  totalVolume: string;
  totalBets: number;
  yesPrice: string;
  noPrice: string;
  upvotes: number;
  hasUpvoted?: boolean;
  trendingScore?: number;
  creator?: {
    id: string;
    username?: string;
    address: string;
    reputation: number;
  };
}

export interface Bet {
  id: string;
  marketId: string;
  marketSlug?: string;
  marketQuestion?: string;
  marketEndTime: string;
  marketStatus: string;
  marketOutcome?: number;
  amount: string;
  side: 'yes' | 'no';
  entryPrice: string;
  currentPrice?: number;
  currentValue: string;
  profitLoss: string;
  isSettled: boolean;
  payout?: string;
  username?: string;
  entryTimestamp: string;
}

export interface Portfolio {
  activeBets: Bet[];
  settledBets: Bet[];
  stats: PortfolioStats;
}

export interface Wager {
  id: string;
  onchainId: string;
  creatorId: string;
  takerId?: string;
  marketId: string;
  amount: string;
  odds: [number, number];
  creatorSide: string;
  status: 'OPEN' | 'MATCHED' | 'RESOLVED' | 'CANCELLED';
  winner?: string;
  createdAt: string;
  expiresAt: string;
  matchedAt?: string;
  settledAt?: string;
  creator?: {
    id: string;
    username?: string;
    reputation: number;
  };
}

export interface PricePoint {
  timestamp: number;
  yesPrice: string;
  noPrice: string;
  volume: string;
}

export interface PortfolioStats {
  totalValue: string;
  totalProfitLoss: string;
  winRate: number;
  activeBets: number;
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  averageBetSize: string;
  totalVolume: string;
}

export interface MarketFilters {
  status?: MarketStatus;
  category?: string;
  sortBy?: 'volume' | 'ending_soon' | 'newest';
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Admin types
export interface AdminStats {
  totalMarkets: number;
  activeMarkets: number;
  totalVolume: string;
  totalUsers: number;
  totalBets: number;
  totalWagers: number;
  platformFees: string;
  last24hVolume: string;
  last24hUsers: number;
}

export interface AdminMarket extends Market {
  isVerified: boolean;
  isFeatured: boolean;
  reportCount: number;
  moderationNotes?: string;
}

export interface AdminUser {
  id: string;
  address: string;
  username?: string;
  email?: string;
  reputation: number;
  totalVolume: string;
  totalBets: number;
  winRate: number;
  createdAt: string;
  lastActive: string;
  isBlocked: boolean;
}

export interface TrendingMarket extends Market {
  trendingScore: number;
  volumeChange24h: string;
  upvotesChange24h: number;
  timestamp: number;
}

// Wallet Types
export interface WalletProvider {
  isLace: boolean;
  enable: () => Promise<any>;
  getAddress: () => Promise<string>;
  getBalance: () => Promise<string>;
  getNetworkId: () => Promise<string>;
  signTransaction: (tx: any) => Promise<any>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  off?: (event: string, handler: (...args: any[]) => void) => void;
}

export interface TransactionRequest {
  to: string;
  data: string;
  value?: string;
  gasLimit?: string;
}

export interface SignedTransaction {
  hash: string;
  from: string;
  to: string;
  signature: string;
}
