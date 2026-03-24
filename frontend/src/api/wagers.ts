import { api } from '../lib/api';

export interface PlaceBetRequest {
  marketId: string;
  amount: string;
  side: 'yes' | 'no';
  slippage?: number;
}

export interface PlaceBetResponse {
  wagerId: string;
  positionId: string;
  transaction: {
    hash: string;
    from: string;
    to: string;
  };
  entryPrice: string;
  estimatedPayout: string;
}

export interface CreateP2PWagerRequest {
  marketId: string;
  amount: string;
  side: 'yes' | 'no';
  odds: [number, number];
  duration: number;
}

export interface AcceptWagerRequest {
  wagerId: string;
}

export interface ClaimWinningsRequest {
  positionId: string;
}

export const wagersApi = {
  // Place a bet on market (AMM)
  placeBet: async (data: PlaceBetRequest): Promise<PlaceBetResponse> => {
    const response = await api.post('/wagers', data);
    return response.data.data;
  },

  // Create P2P wager offer
  createP2PWager: async (data: CreateP2PWagerRequest) => {
    const response = await api.post('/wagers/p2p', data);
    return response.data.data;
  },

  // Accept P2P wager
  acceptWager: async (wagerId: string, data: AcceptWagerRequest) => {
    const response = await api.post(`/wagers/p2p/${wagerId}/accept`, data);
    return response.data.data;
  },

  // Get user's wagers
  getUserWagers: async () => {
    const response = await api.get('/wagers/user');
    return response.data.data;
  },

  // Claim winnings from settled position
  claimWinnings: async (positionId: string) => {
    const response = await api.post(`/wagers/${positionId}/claim`);
    return response.data.data;
  },

  // Cancel P2P wager (if not matched)
  cancelWager: async (wagerId: string) => {
    const response = await api.delete(`/wagers/p2p/${wagerId}`);
    return response.data.data;
  },
};
