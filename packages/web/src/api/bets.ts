import { api } from '../lib/api';
import type { ApiResponse, Bet, Portfolio, PortfolioStats } from '../types';
export type { ApiResponse, Bet, Portfolio, PortfolioStats };


class BetsApi {
  async getPortfolio(): Promise<Portfolio> {
    const { data } = await api.get<ApiResponse<Portfolio>>('/users/me/portfolio');
    return data.data!;
  }

  async getBetsByMarket(marketId: string): Promise<Bet[]> {
    const { data } = await api.get<ApiResponse<Bet[]>>(`/markets/${marketId}/bets`);
    return data.data!;
  }

  async getStats(): Promise<PortfolioStats> {
    const { data } = await api.get<ApiResponse<Portfolio>>('/users/me/portfolio');
    return data.data!.stats;
  }

  async getBetById(id: string): Promise<Bet> {
    const { data } = await api.get<ApiResponse<Bet>>(`/bets/${id}`);
    return data.data!;
  }

  async getWagerById(id: string): Promise<any> {
    const { data } = await api.get<ApiResponse<any>>(`/wagers/${id}`);
    return data.data!;
  }

  async claimWinnings(
    betId: string
  ): Promise<{ success: boolean; txHash: string; amount: string }> {
    const { data } = await api.post(`/wagers/${betId}/claim`, {});
    return data;
  }
}

export const betsApi = new BetsApi();
