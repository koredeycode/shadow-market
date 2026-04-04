import { api } from '../lib/api';
import type { ApiResponse } from '../types';

export interface Position {
  id: string;
  marketId: string;
  marketQuestion: string;
  side: 'yes' | 'no';
  amount: string;
  entryPrice: number;
  currentPrice: number;
  entryTimestamp: string;
  isSettled: boolean;
  settledAt?: string;
  payout?: string;
  profitLoss?: string;

  // Market info
  marketSlug: string;
  marketStatus: 'open' | 'locked' | 'resolved' | 'cancelled';
  marketEndTime: string;
  marketOutcome?: number;
}

export interface PortfolioStats {
  totalValue: string;
  totalProfitLoss: string;
  winRate: number;
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  totalVolume: string;
  averageBetSize: string;
}

export interface Portfolio {
  activePositions: Position[];
  settledPositions: Position[];
  stats: PortfolioStats;
}

class PositionsApi {
  async getPortfolio(): Promise<Portfolio> {
    const { data } = await api.get<ApiResponse<Portfolio>>('/positions');
    return data.data!;
  }

  async getPositionsByMarket(marketId: string): Promise<Position[]> {
    const { data } = await api.get<ApiResponse<Position[]>>(`/positions/market/${marketId}`);
    return data.data!;
  }

  async getStats(): Promise<PortfolioStats> {
    const { data } = await api.get<ApiResponse<PortfolioStats>>('/positions/stats');
    return data.data!;
  }

  async claimWinnings(
    positionId: string
  ): Promise<{ success: boolean; txHash: string; amount: string }> {
    const { data } = await api.post(`/wagers/${positionId}/claim`, {});
    return data;
  }
}

export const positionsApi = new PositionsApi();
