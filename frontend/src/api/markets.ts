import { api } from '../lib/api';
import type { ApiResponse, Market, MarketFilters, PaginatedResponse } from '../types';

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

  getTrending: async (limit: number = 10): Promise<Market[]> => {
    const { data } = await api.get<ApiResponse<Market[]>>(`/markets/trending?limit=${limit}`);
    return data.data!;
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
};
