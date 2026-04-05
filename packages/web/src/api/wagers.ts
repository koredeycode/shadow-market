import { api } from '../lib/api';

export interface PlaceBetRequest {
  marketId: string;
  amount: string;
  side: 'yes' | 'no';
  slippage?: number;
  skipRedirect?: boolean;
  txHash?: string;
  onchainId?: string;
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
  txHash?: string;
  onchainId?: string;
}

export interface AcceptWagerRequest {
  wagerId?: string;
  txHash?: string;
}

export interface ClaimWinningsRequest {
  positionId: string;
}

export const wagersApi = {
  // Place a bet on market (AMM)
  placeBet: async (data: PlaceBetRequest): Promise<PlaceBetResponse> => {
    const { skipRedirect, marketId, ...payload } = data;
    const response = await api.post(`/markets/${marketId}/bets`, payload, {
      ['_skipRedirect' as any]: skipRedirect,
    } as any);
    return response.data.data;
  },

  // Create P2P wager offer
  createP2PWager: async (data: CreateP2PWagerRequest) => {
    const { marketId, ...payload } = data;
    const response = await api.post(`/markets/${marketId}/wagers`, payload);
    return response.data.data;
  },

  // Accept/Sync P2P wager
  acceptWager: async (marketId: string, wagerId: string, data: AcceptWagerRequest) => {
    const { txHash } = data;
    const response = await api.patch(`/markets/${marketId}/wagers/${wagerId}`, { 
      status: 'MATCHED',
      txHash 
    });
    return response.data.data;
  },

  // Get user's active wagers
  getUserWagers: async () => {
    const response = await api.get('/users/me/wagers');
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
