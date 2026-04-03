import { api } from '../lib/api';
import type {
  ApiResponse,
  Market,
  MarketFilters,
  PaginatedResponse,
  TrendingMarket,
} from '../types';

export const marketsApi = {
  getAll: async (filters: MarketFilters = {}): Promise<PaginatedResponse<Market>> => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const { data } = await api.get<ApiResponse<PaginatedResponse<Market>>>(
      `/markets?${params.toString()}`
    );
    return data.data!;
  },

  getById: async (id: string): Promise<Market> => {
    const { data } = await api.get<ApiResponse<Market>>(`/markets/${id}`);
    return data.data!;
  },

  getTrending: async (limit: number = 10): Promise<TrendingMarket[]> => {
    const { data } = await api.get<ApiResponse<TrendingMarket[]>>(
      `/markets/trending?limit=${limit}`
    );
    return data.data!;
  },

  getNew: async (limit: number = 10): Promise<Market[]> => {
    const { data } = await api.get<ApiResponse<Market[]>>(`/markets/new?limit=${limit}`);
    return data.data!;
  },

  upvote: async (marketId: string): Promise<void> => {
    await api.post(`/markets/${marketId}/upvote`);
  },

  removeUpvote: async (marketId: string): Promise<void> => {
    await api.delete(`/markets/${marketId}/upvote`);
  },

  search: async (query: string, limit: number = 10): Promise<Market[]> => {
    const { data } = await api.get<ApiResponse<Market[]>>(
      `/markets/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    return data.data!;
  },

  getPriceHistory: async (id: string, range: string = '24h') => {
    const { data } = await api.get<ApiResponse<any>>(`/markets/${id}/chart?range=${range}`);
    return data.data!;
  },

  getStats: async (id: string) => {
    const { data } = await api.get<ApiResponse<any>>(`/markets/${id}/stats`);
    return data.data!;
  },

  create: async (data: {
    question: string;
    description?: string;
    category: string;
    tags?: string[];
    endTime: string;
    resolutionSource: string;
    onchainId: string;
    txHash: string;
  }): Promise<Market> => {
    const { data: response } = await api.post<ApiResponse<Market>>('/markets', data);
    return response.data!;
  },
};
