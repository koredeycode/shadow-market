import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
  question: string;
  volume: number;
  totalPositions: number;
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
  private async getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // Portfolio value over time (requires auth)
  async getPortfolioValueHistory(timeRange: TimeRange = '7d'): Promise<PortfolioValuePoint[]> {
    const headers = await this.getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/analytics/portfolio-value`, {
      headers,
      params: { timeRange },
    });
    return response.data;
  }

  // Market volume over time (public)
  async getMarketVolumeHistory(timeRange: TimeRange = '7d'): Promise<MarketVolumePoint[]> {
    const response = await axios.get(`${API_BASE_URL}/analytics/market-volume`, {
      params: { timeRange },
    });
    return response.data;
  }

  // User activity over time (public)
  async getUserActivityHistory(timeRange: TimeRange = '7d'): Promise<UserActivityPoint[]> {
    const response = await axios.get(`${API_BASE_URL}/analytics/user-activity`, {
      params: { timeRange },
    });
    return response.data;
  }

  // Category breakdown (public)
  async getCategoryStats(): Promise<CategoryStats[]> {
    const response = await axios.get(`${API_BASE_URL}/analytics/categories`);
    return response.data;
  }

  // Top markets by volume (public)
  async getTopMarkets(limit: number = 10): Promise<TopMarket[]> {
    const response = await axios.get(`${API_BASE_URL}/analytics/top-markets`, {
      params: { limit },
    });
    return response.data;
  }

  // Top traders by volume (public)
  async getTopTraders(limit: number = 10): Promise<TopTrader[]> {
    const response = await axios.get(`${API_BASE_URL}/analytics/top-traders`, {
      params: { limit },
    });
    return response.data;
  }

  // Platform-wide statistics (public)
  async getPlatformStats(): Promise<PlatformStats> {
    const response = await axios.get(`${API_BASE_URL}/analytics/platform-stats`);
    return response.data;
  }

  // Export data as CSV
  async exportPortfolioData(timeRange: TimeRange = 'all'): Promise<Blob> {
    const headers = await this.getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/analytics/export/portfolio`, {
      headers,
      params: { timeRange },
      responseType: 'blob',
    });
    return response.data;
  }

  async exportMarketData(marketId: string): Promise<Blob> {
    const response = await axios.get(`${API_BASE_URL}/analytics/export/market/${marketId}`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export const analyticsApi = new AnalyticsApi();
