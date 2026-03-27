import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WalletState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  balance: string | null;
  networkId: string | null;

  // Wallet provider
  provider: any | null;

  // Actions
  connect: (provider: any, address: string, networkId: string) => void;
  disconnect: () => void;
  updateBalance: (balance: string) => void;
  setConnecting: (isConnecting: boolean) => void;
  isWalletModalOpen: boolean;
  setWalletModalOpen: (isOpen: boolean) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    set => ({
      // Initial state
      isConnected: false,
      isConnecting: false,
      address: null,
      balance: null,
      networkId: null,
      provider: null,

      // Actions
      connect: (provider, address, networkId) => {
        set({
          isConnected: true,
          isConnecting: false,
          address,
          networkId,
          provider,
        });
      },

      disconnect: () => {
        set({
          isConnected: false,
          isConnecting: false,
          address: null,
          balance: null,
          networkId: null,
          provider: null,
        });
      },

      updateBalance: balance => {
        set({ balance });
      },

      setConnecting: isConnecting => {
        set({ isConnecting });
      },
      isWalletModalOpen: false,
      setWalletModalOpen: isOpen => {
        set({ isWalletModalOpen: isOpen });
      },
    }),
    {
      name: 'wallet-storage',
      // Only persist address and networkId, not the provider
      partialize: state => ({
        address: state.address,
        networkId: state.networkId,
      }),
    }
  )
);
