/**
 * Common types shared across the Shadow Market API
 */

/**
 * Market status enum
 */
export enum MarketStatus {
  ACTIVE = 'active',
  LOCKED = 'locked',
  RESOLVED = 'resolved',
  CANCELLED = 'cancelled',
}

/**
 * Wager status enum
 */
export enum WagerStatus {
  OPEN = 'open',
  ACCEPTED = 'accepted',
  RESOLVED = 'resolved',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

/**
 * Pool market data structure
 */
export interface PoolMarket {
  marketId: string;
  question: string;
  questionHash: Uint8Array;
  resolverAddress: string;
  createdAt: bigint;
  endTime: bigint;
  status: MarketStatus;
  totalYesAmount: bigint;
  totalNoAmount: bigint;
  outcome?: boolean;
}

/**
 * P2P Wager data structure
 */
export interface P2PWager {
  wagerId: string;
  makerAddress: string;
  takerAddress?: string;
  question: string;
  questionHash: Uint8Array;
  makerStake: bigint;
  takerStake: bigint;
  makerPrediction: boolean;
  expiryTime: bigint;
  status: WagerStatus;
  outcome?: boolean;
  createdAt: bigint;
  acceptedAt?: bigint;
  resolvedAt?: bigint;
}

/**
 * User bet position in a pool market
 */
export interface BetPosition {
  marketId: string;
  userAddress: string;
  yesAmount: bigint;
  noAmount: bigint;
  claimed: boolean;
}

/**
 * Contract transaction result
 */
export interface TransactionResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

/**
 * Market statistics
 */
export interface MarketStats {
  totalVolume: bigint;
  totalBets: number;
  uniqueBettors: number;
  yesPercentage: number;
  noPercentage: number;
}

/**
 * Wager statistics
 */
export interface WagerStats {
  totalWagers: number;
  openWagers: number;
  acceptedWagers: number;
  totalVolume: bigint;
}
