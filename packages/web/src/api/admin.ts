import { api } from '../lib/api';
import type { AdminMarket, AdminStats, AdminUser, ApiResponse, PaginatedResponse } from '../types';

export const adminApi = {
  // Dashboard Stats
  getStats: async (): Promise<AdminStats> => {
    const { data } = await api.get<ApiResponse<AdminStats>>('/admin/stats');
    return data.data!;
  },

  // Markets Management
  getAllMarkets: async (
    filters: {
      status?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<PaginatedResponse<AdminMarket>> => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const { data } = await api.get<ApiResponse<PaginatedResponse<AdminMarket>>>(
      `/admin/markets?${params.toString()}`
    );
    return data.data!;
  },

  toggleMarketFeatured: async (marketId: string): Promise<void> => {
    await api.post(`/admin/markets/${marketId}/toggle-featured`);
  },

  toggleMarketVerified: async (marketId: string): Promise<void> => {
    await api.post(`/admin/markets/${marketId}/toggle-verified`);
  },

  lockMarket: async (marketId: string): Promise<void> => {
    await api.post(`/admin/markets/${marketId}/lock`);
  },

  resolveMarket: async (marketId: string, outcome: number): Promise<void> => {
    await api.post(`/admin/markets/${marketId}/resolve`, { outcome });
  },

  cancelMarket: async (marketId: string, reason: string): Promise<void> => {
    await api.post(`/admin/markets/${marketId}/cancel`, { reason });
  },

  // Users Management
  getAllUsers: async (
    filters: {
      search?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<PaginatedResponse<AdminUser>> => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const { data } = await api.get<ApiResponse<PaginatedResponse<AdminUser>>>(
      `/admin/users?${params.toString()}`
    );
    return data.data!;
  },

  toggleUserBlock: async (userId: string): Promise<void> => {
    await api.post(`/admin/users/${userId}/toggle-block`);
  },

  updateUserKyc: async (userId: string, status: string): Promise<void> => {
    await api.post(`/admin/users/${userId}/kyc`, { status });
  },

  // Analytics
  getActivityLog: async (limit: number = 50) => {
    const { data } = await api.get<ApiResponse<any[]>>(`/admin/activity-log?limit=${limit}`);
    return data.data!;
  },

  getRevenueStats: async (range: '7d' | '30d' | '90d' = '30d') => {
    const { data } = await api.get<ApiResponse<any>>(`/admin/revenue?range=${range}`);
    return data.data!;
  },
};
