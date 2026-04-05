import { api } from '../lib/api';
import type { ApiResponse } from '../types';

export type TimeRange = '1h' | '24h' | '7d' | '30d' | 'all';

export interface PortfolioValuePoint {
  timestamp: string;
  totalValue: number;
  profitLoss: number;
  activePositions: number;
}

export interface MarketVolumePoint {
  timestamp: string;
  volume: number;
  trades: number;
  uniqueUsers: number;
}

export interface CategoryStats {
  category: string;
  volume: number;
  marketCount: number;
  avgVolume: number;
}

export interface UserActivityPoint {
  timestamp: string;
  activeUsers: number;
  newUsers: number;
  totalTrades: number;
}

export interface TopMarket {
  id: string;
  slug?: string;
  question: string;
  volume: number;
  totalBets: number;
  category: string;
}

export interface TopTrader {
  address: string;
  username?: string;
  totalVolume: number;
  profitLoss: number;
  winRate: number;
  totalBets: number;
}

export interface PlatformStats {
  totalVolume: string;
  totalMarkets: number;
  totalUsers: number;
  totalTrades: number;
  activeMarkets: number;
  averageMarketVolume: string;
  totalValueLocked: string;
}

class AnalyticsApi {
  // Market volume over time (public)
  async getMarketVolumeHistory(timeRange: TimeRange = '7d'): Promise<MarketVolumePoint[]> {
    const { data } = await api.get<ApiResponse<MarketVolumePoint[]>>('/analytics/market-volume', {
      params: { timeRange },
    });
    return data.data!;
  }

  // User activity over time (public)
  async getUserActivityHistory(timeRange: TimeRange = '7d'): Promise<UserActivityPoint[]> {
    const { data } = await api.get<ApiResponse<UserActivityPoint[]>>('/analytics/user-activity', {
      params: { timeRange },
    });
    return data.data!;
  }

  // Category breakdown (public)
  async getCategoryStats(): Promise<CategoryStats[]> {
    const { data } = await api.get<ApiResponse<CategoryStats[]>>('/analytics/categories');
    return data.data!;
  }

  // Top markets by volume (public)
  async getTopMarkets(limit: number = 10): Promise<TopMarket[]> {
    const { data } = await api.get<ApiResponse<TopMarket[]>>('/analytics/top-markets', {
      params: { limit },
    });
    return data.data!;
  }

  // Top traders by volume (public)
  async getTopTraders(limit: number = 10): Promise<TopTrader[]> {
    const { data } = await api.get<ApiResponse<TopTrader[]>>('/analytics/top-traders', {
      params: { limit },
    });
    return data.data!;
  }

  // Platform-wide statistics (public)
  async getPlatformStats(): Promise<PlatformStats> {
    const { data } = await api.get<ApiResponse<PlatformStats>>('/analytics/platform-stats');
    return data.data!;
  }

  // Portfolio value history (private/public)
  async getPortfolioValueHistory(timeRange: TimeRange = '7d'): Promise<PortfolioValuePoint[]> {
    const { data } = await api.get<ApiResponse<PortfolioValuePoint[]>>('/analytics/portfolio-value', {
      params: { timeRange },
    });
    return data.data!;
  }

  // Export data as CSV
  async exportPortfolioData(timeRange: TimeRange = 'all'): Promise<Blob> {
    const { data } = await api.get('/analytics/export/portfolio', {
      params: { timeRange },
      responseType: 'blob',
    });
    return data;
  }

  async exportMarketData(marketId: string): Promise<Blob> {
    const { data } = await api.get(`/analytics/export/market/${marketId}`, {
      responseType: 'blob',
    });
    return data;
  }
}

export const analyticsApi = new AnalyticsApi();
