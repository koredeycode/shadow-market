import { create } from 'zustand';
import { contractManager } from '../services/contract.service';

interface ContractState {
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;

  // Actions
  initialize: (
    wallet: any,
    shieldedKeys?: {
      shieldedCoinPublicKey: string;
      shieldedEncryptionPublicKey: string;
    }
  ) => Promise<boolean>;
  cleanup: () => void;
  setError: (error: string | null) => void;
}

export const useContractStore = create<ContractState>(set => ({
  isInitialized: false,
  isInitializing: false,
  error: null,

  initialize: async (
    wallet: any,
    shieldedKeys?: {
      shieldedCoinPublicKey: string;
      shieldedEncryptionPublicKey: string;
    }
  ) => {
    set({ isInitializing: true, error: null });

    try {
      // Get contract address from env
      const contractAddress =
        import.meta.env.VITE_MIDNIGHT_SHADOW_MARKET_CONTRACT_ADDRESS?.trim() ||
        import.meta.env.VITE_MIDNIGHT_UNIFIED_CONTRACT_ADDRESS?.trim() ||
        import.meta.env.VITE_UNIFIED_CONTRACT_ADDRESS?.trim();

      if (!contractAddress) {
        throw new Error('Contract address not configured. Please set VITE_MIDNIGHT_SHADOW_MARKET_CONTRACT_ADDRESS.');
      }

      console.log('Contract configuration:');
      console.log('  Contract Address:', contractAddress);
      console.log('  Network ID:', import.meta.env.VITE_MIDNIGHT_NETWORK_ID || 'undeployed');

      // Configure the contract connection
      const config = {
        indexerUri: import.meta.env.VITE_MIDNIGHT_INDEXER_URL || import.meta.env.VITE_INDEXER_URL || 'http://localhost:8088/api/v3',
        indexerWsUri: import.meta.env.VITE_MIDNIGHT_INDEXER_WS || import.meta.env.VITE_MIDNIGHT_INDEXER_WS_URL || import.meta.env.VITE_INDEXER_WS || 'ws://localhost:8088/api/v3',
        proverServerUri: import.meta.env.VITE_MIDNIGHT_PROOF_SERVER_URL || import.meta.env.VITE_PROOF_SERVER_URL || 'http://localhost:6300',
        zkConfigPath: `${window.location.origin}/zk-config`, // Local absolute URL for ZK artifacts
        contractAddress,
        networkId: import.meta.env.VITE_MIDNIGHT_NETWORK_ID || import.meta.env.VITE_NETWORK_ID || 'undeployed',
        shieldedCoinPublicKey: shieldedKeys?.shieldedCoinPublicKey,
        shieldedEncryptionPublicKey: shieldedKeys?.shieldedEncryptionPublicKey,
      };

      // New API uses wallet and config
      const success = await contractManager.initialize(wallet, config);

      if (success) {
        set({ isInitialized: true, isInitializing: false });
        return true;
      } else {
        set({
          isInitialized: false,
          isInitializing: false,
          error: 'Failed to initialize contract',
        });
        return false;
      }
    } catch (error: any) {
      set({
        isInitialized: false,
        isInitializing: false,
        error: error.message || 'Failed to initialize contract',
      });
      return false;
    }
  },

  cleanup: () => {
    contractManager.cleanup();
    set({ isInitialized: false, error: null });
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
