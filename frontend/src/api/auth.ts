import { api } from '../lib/api';

export interface AuthRequest {
  address: string;
  username?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    address: string;
    username: string | null;
    createdAt: string;
  };
  token: string;
}

export interface UserProfile {
  id: string;
  address: string;
  username: string | null;
  createdAt: string;
}

export const authApi = {
  /**
   * Authenticate with wallet address (creates user if doesn't exist)
   */
  authenticate: async (data: AuthRequest): Promise<AuthResponse> => {
    const response = await api.post('/users/auth', data);
    return response.data.data;
  },

  /**
   * Get current user profile
   */
  getMe: async (): Promise<UserProfile> => {
    const response = await api.get('/users/me');
    return response.data.data;
  },

  /**
   * Update current user profile
   */
  updateProfile: async (data: { username: string }): Promise<UserProfile> => {
    const response = await api.patch('/users/me', data);
    return response.data.data;
  },

  /**
   * Elevate current user to admin status
   */
  adminClaim: async (data: any): Promise<void> => {
    await api.post('/admin/auth', data);
  },
};
