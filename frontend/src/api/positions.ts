import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
  private async getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async getPortfolio(): Promise<Portfolio> {
    const headers = await this.getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/positions`, { headers });
    return response.data;
  }

  async getPositionsByMarket(marketId: string): Promise<Position[]> {
    const headers = await this.getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/positions/market/${marketId}`, { headers });
    return response.data;
  }

  async getStats(): Promise<PortfolioStats> {
    const headers = await this.getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/positions/stats`, { headers });
    return response.data;
  }

  async claimWinnings(
    positionId: string
  ): Promise<{ success: boolean; txHash: string; amount: string }> {
    const headers = await this.getAuthHeaders();
    const response = await axios.post(
      `${API_BASE_URL}/wagers/${positionId}/claim`,
      {},
      { headers }
    );
    return response.data;
  }
}

export const positionsApi = new PositionsApi();
