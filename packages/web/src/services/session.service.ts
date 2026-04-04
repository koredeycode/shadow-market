import axios from 'axios';
import { useWalletStore } from '../store/wallet.store.js';

export const sessionService = {
  /**
   * Authorize a terminal session by signing a verification message
   */
  async authorizeTerminal(pairingCode: string): Promise<any> {
    const { provider, address } = useWalletStore.getState();
    if (!provider || !address) throw new Error('Wallet not connected');

    // Message to sign for session verification
    const message = `I authorize this Shadow Market terminal session: ${pairingCode}`;
    
    try {
      // Assuming the provider has a signData or signMethod
      // If using the standard Midnight DApp Connector
      let signature;
      if (typeof provider.signData === 'function') {
        const response = await provider.signData(new TextEncoder().encode(message));
        signature = Buffer.from(response).toString('hex');
      } else {
        // Fallback for different provider structures
        throw new Error('Wallet does not support message signing');
      }

      const response = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/sessions/authorize`, {
        pairingCode,
        walletAddress: address,
        signature
      });

      return response.data;
    } catch (error: any) {
      console.error('Session authorization failed:', error);
      throw error;
    }
  }
};
