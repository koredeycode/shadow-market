import axios from 'axios';
import { useWalletStore } from '../store/wallet.store.js';

export const sessionService = {
  /**
   * Get terminal session status for verification
   */
  async getSessionStatus(pairingCode: string): Promise<any> {
    const response = await axios.get(`${import.meta.env.VITE_API_URL || '/api'}/sessions/${pairingCode}/status`);
    return response.data.data;
  },

  /**
   * Authorize a terminal session by signing a verification message
   */
  async authorizeTerminal(pairingCode: string, walletAddress: string): Promise<any> {
    const { provider } = useWalletStore.getState();
    if (!provider) throw new Error('Wallet not connected');
    
    try {
      // In a real Midnight implementation, we'd use the provider to sign. 
      // For now, we'll send the authorization request.
      const response = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/sessions/authorize`, {
        pairingCode,
        walletAddress,
        signature: 'WEB_PROOF_SUCCESS' // Placeholder, in production this would be a real proof/sig
      });

      return response.data;
    } catch (error: any) {
      console.error('Session authorization failed:', error);
      throw error;
    }
  }
};
