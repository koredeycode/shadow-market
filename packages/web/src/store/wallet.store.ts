import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WalletState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  unshieldedAddress: string | null;
  addressDisplayMode: 'shielded' | 'unshielded';
  nightBalance: string | null;
  unshieldedNightBalance: string | null;
  dustBalance: string | null;
  networkId: string | null;
  autoConnect: boolean;
  username: string | null;
  walletType: 'lace' | '1am' | null;
  proofServerUrl: string | null;
  proofServerOption: 'env' | 'local' | 'custom';

  // Wallet provider
  provider: any | null;

  // Actions
  connect: (provider: any, addresses: { shielded: string; unshielded?: string }, networkId: string, walletType: 'lace' | '1am', username?: string) => void;
  setAddressDisplayMode: (mode: 'shielded' | 'unshielded') => void;
  disconnect: () => void;
  updateBalances: (balances: { night: string; unshieldedNight: string; dust: string }) => void;
  setConnecting: (isConnecting: boolean) => void;
  setProofServer: (option: 'env' | 'local' | 'custom', url?: string) => void;
  isWalletModalOpen: boolean;
  setWalletModalOpen: (isOpen: boolean) => void;
  isTransacting: boolean;
  setTransacting: (isTransacting: boolean) => void;
  isTerminalModalOpen: boolean;
  setTerminalModalOpen: (isOpen: boolean) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    set => ({
      // Initial state
      isConnected: false,
      isConnecting: false,
      address: null,
      unshieldedAddress: null,
      addressDisplayMode: 'unshielded',
      nightBalance: null,
      unshieldedNightBalance: null,
      dustBalance: null,
      networkId: null,
      provider: null,
      autoConnect: false,
      username: null,
      walletType: null,
      proofServerUrl: null,
      proofServerOption: 'env',

      // Actions
      connect: (provider, addresses, networkId, walletType, username) => {
        set({
          isConnected: true,
          isConnecting: false,
          address: addresses.shielded,
          unshieldedAddress: addresses.unshielded || null,
          networkId,
          provider,
          walletType,
          autoConnect: true,
          username: username || null,
        });
      },

      setAddressDisplayMode: mode => {
        set({ addressDisplayMode: mode });
      },

      disconnect: () => {
        set({
          isConnected: false,
          isConnecting: false,
          address: null,
          unshieldedAddress: null,
          nightBalance: null,
          unshieldedNightBalance: null,
          dustBalance: null,
          networkId: null,
          provider: null,
          autoConnect: false,
          username: null,
          walletType: null,
        });
      },

      updateBalances: balances => {
        set({
          nightBalance: balances.night,
          unshieldedNightBalance: balances.unshieldedNight,
          dustBalance: balances.dust,
        });
      },

      setConnecting: isConnecting => {
        set({ isConnecting });
      },
      isWalletModalOpen: false,
      setWalletModalOpen: isOpen => {
        set({ isWalletModalOpen: isOpen });
      },
      isTransacting: false,
      setTransacting: isTransacting => {
        set({ isTransacting });
      },
      isTerminalModalOpen: false,
      setTerminalModalOpen: isOpen => {
        set({ isTerminalModalOpen: isOpen });
      },
      setProofServer: (option, url) => {
        set({ 
          proofServerOption: option, 
          proofServerUrl: url || (option === 'local' ? 'http://localhost:6300' : null) 
        });
      },
    }),
    {
      name: 'wallet-storage',
      // Only persist necessary state
      partialize: state => ({
        address: state.address,
        unshieldedAddress: state.unshieldedAddress,
        addressDisplayMode: state.addressDisplayMode,
        networkId: state.networkId,
        autoConnect: state.autoConnect,
        username: state.username,
        walletType: state.walletType,
        proofServerOption: state.proofServerOption,
        proofServerUrl: state.proofServerUrl,
      }),
    }
  )
);
