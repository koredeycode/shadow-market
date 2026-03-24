// Shared type definitions for contracts
export type MarketType = 'BINARY' | 'CATEGORICAL' | 'SCALAR';
export type MarketStatus = 'PENDING' | 'OPEN' | 'LOCKED' | 'RESOLVED' | 'CANCELLED';

export interface MarketMetadata {
  marketId: string;
  creator: string;
  marketType: MarketType;
  question: string;
  category: string;
  endTime: number;
  resolutionSource: string;
  minBet: string;
  maxBet: string;
  createdAt: number;
}
