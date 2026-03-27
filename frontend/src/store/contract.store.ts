import { create } from 'zustand';
import { contractManager } from '../services/contract.service';

interface ContractState {
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;

  // Actions
  initialize: (wallet: any, privateState?: any) => Promise<boolean>;
  cleanup: () => void;
  setError: (error: string | null) => void;
}

export const useContractStore = create<ContractState>(set => ({
  isInitialized: false,
  isInitializing: false,
  error: null,

  initialize: async (wallet: any, _privateState?: any) => {
    set({ isInitializing: true, error: null });

    try {
      // New API uses wallet only, gets private state internally
      const success = await contractManager.initialize(wallet);

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
