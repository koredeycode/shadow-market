import { create } from 'zustand';
import { contractManager } from '../services/contract.service';

interface ContractState {
  isInitialized: boolean;
  isInitializing: boolean;
  protocolInitialized: boolean;
  marketCount: bigint;
  wagerCount: bigint;
  error: string | null;

  // Actions
  initialize: (
    wallet: any,
    walletType: 'lace' | '1am',
    shieldedKeys?: {
      shieldedCoinPublicKey: string;
      shieldedEncryptionPublicKey: string;
    },
    proofServerUrl?: string | null
  ) => Promise<boolean>;
  cleanup: () => void;
  setProtocolInitialized: (status: boolean) => void;
  setStats: (marketCount: bigint, wagerCount: bigint) => void;
  setError: (error: string | null) => void;
}

export const useContractStore = create<ContractState>(set => ({
  isInitialized: false,
  isInitializing: false,
  protocolInitialized: false,
  marketCount: 0n,
  wagerCount: 0n,
  error: null,

  initialize: async (
    wallet: any,
    walletType: 'lace' | '1am',
    shieldedKeys?: {
      shieldedCoinPublicKey: string;
      shieldedEncryptionPublicKey: string;
    },
    proofServerUrl?: string | null
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
        proverServerUri: proofServerUrl || import.meta.env.VITE_MIDNIGHT_PROOF_SERVER_URL || import.meta.env.VITE_PROOF_SERVER_URL || 'http://localhost:6300',
        zkConfigPath: `${window.location.origin}/zk-config`, // Local absolute URL for ZK artifacts
        contractAddress,
        networkId: import.meta.env.VITE_MIDNIGHT_NETWORK_ID || import.meta.env.VITE_NETWORK_ID || 'undeployed',
        shieldedCoinPublicKey: shieldedKeys?.shieldedCoinPublicKey,
        shieldedEncryptionPublicKey: shieldedKeys?.shieldedEncryptionPublicKey,
        walletType,
      };

      // New API uses wallet and config
      console.log('Synchronizing terminal with proof server:', config.proverServerUri);
      const success = await contractManager.initialize(wallet, config);

      if (success) {
        console.log('Terminal synchronization complete.');
        set({ isInitialized: true, isInitializing: false });
        return true;
      } else {
        console.error('Terminal synchronization failed (Returned False)');
        set({
          isInitialized: false,
          isInitializing: false,
          error: 'Failed to initialize contract',
        });
        return false;
      }
    } catch (error: any) {
      console.error('CRITICAL: Terminal synchronization exception:', error);
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
    set({ isInitialized: false, error: null, marketCount: 0n, wagerCount: 0n });
  },

  setProtocolInitialized: (status: boolean) => {
    set({ protocolInitialized: status });
  },
  setStats: (marketCount: bigint, wagerCount: bigint) => {
    set({ marketCount, wagerCount });
  },
  setError: (error: string | null) => {
    set({ error });
  },
}));
