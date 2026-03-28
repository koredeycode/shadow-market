import React, { createContext, useContext, ReactNode } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useContract } from '../hooks/useContract';
import { useWalletStore } from '../store/wallet.store';

interface MidnightContextType {
  // Wallet State
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  balance: string | null;
  formattedBalance: string;
  formattedAddress: string;

  // Contract State
  isContractInitialized: boolean;
  isContractInitializing: boolean;
  contractError: string | null;

  // Actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  refreshBalance: () => Promise<void>;

  // Contract Actions
  placeBet: (marketId: string, side: 'YES' | 'NO', amount: number) => Promise<{ success: boolean }>;
  createMarket: (
    marketId: string,
    question: string,
    resolverAddress: string,
    endTime: Date
  ) => Promise<boolean | null>;
  claimPoolWinnings: (betId: string) => Promise<boolean | null>;

  // UI Helpers
  isWalletModalOpen: boolean;
  setWalletModalOpen: (open: boolean) => void;
}

const MidnightContext = createContext<MidnightContextType | undefined>(undefined);

export const MidnightProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const wallet = useWallet();
  const contract = useContract();

  // We can also pull directly from stores if needed for more granular updates
  const isWalletModalOpen = useWalletStore(s => s.isWalletModalOpen);
  const setWalletModalOpen = useWalletStore(s => s.setWalletModalOpen);

  const value: MidnightContextType = {
    // Wallet
    isConnected: wallet.isConnected,
    isConnecting: wallet.isConnecting,
    address: wallet.address,
    balance: wallet.balance,
    formattedBalance: wallet.formattedBalance,
    formattedAddress: wallet.formattedAddress,
    connectWallet: wallet.connectWallet,
    disconnectWallet: wallet.disconnectWallet,
    refreshBalance: wallet.refreshBalance,

    // Contract
    isContractInitialized: contract.isInitialized,
    isContractInitializing: contract.isInitializing,
    contractError: contract.error,
    placeBet: contract.placeBet,
    createMarket: contract.createMarket,
    claimPoolWinnings: contract.claimPoolWinnings,

    // UI
    isWalletModalOpen,
    setWalletModalOpen,
  };

  return <MidnightContext.Provider value={value}>{children}</MidnightContext.Provider>;
};

export const useMidnight = () => {
  const context = useContext(MidnightContext);
  if (context === undefined) {
    throw new Error('useMidnight must be used within a MidnightProvider');
  }
  return context;
};
