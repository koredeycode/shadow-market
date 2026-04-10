import React, { createContext, useContext, ReactNode } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useContract } from '../hooks/useContract';
import { useWalletStore } from '../store/wallet.store';

interface MidnightContextType {
  // Wallet State
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  unshieldedAddress: string | null;
  unshieldedNightBalance: string | null;
  formattedUnshieldedNightBalance: string;
  dustBalance: string | null;
  formattedDustBalance: string;
  formattedAddress: string;

  // Contract State
  isContractInitialized: boolean;
  isContractInitializing: boolean;
  protocolInitialized: boolean;
  marketCount: bigint;
  wagerCount: bigint;
  contractError: string | null;

  // Actions
  connectWallet: (type?: 'lace' | '1am') => Promise<void>;
  disconnectWallet: () => void;
  refreshBalance: () => Promise<void>;

  // Contract Actions
  placeBet: (marketId: string, side: 'YES' | 'NO', amount: number) => Promise<{ txHash: string; onchainId: string }>;
  createMarket: (
    marketId: string,
    question: string,
    endTime: Date
  ) => Promise<{ txHash: string; onchainId: string } | null>;
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
  const autoConnect = useWalletStore(s => s.autoConnect);
  const storedWalletType = useWalletStore(s => s.walletType);

  // Auto-connect on mount if previously connected
  React.useEffect(() => {
    if (!wallet.isConnected && !wallet.isConnecting && autoConnect) {
      console.log('DEBUG [MidnightProvider]: Auto-connecting wallet...', storedWalletType || 'lace');
      // Silently attempt connection without Toast noise during auto-connect
      wallet.connectWallet(storedWalletType || 'lace').catch(console.error);
    }
  }, []); // Run ONLY once on provider mount

  // Auto-refresh balance every 45 seconds (increased from 30 to reduce load)
  React.useEffect(() => {
    if (!wallet.isConnected || wallet.isTransacting) return;

    const interval = setInterval(() => {
      wallet.refreshBalance();
    }, 45000);

    return () => clearInterval(interval);
  }, [wallet.isConnected, wallet.isTransacting, wallet.refreshBalance]);

  const value: MidnightContextType = {
    // Wallet
    isConnected: wallet.isConnected,
    isConnecting: wallet.isConnecting,
    address: wallet.address,
    unshieldedAddress: wallet.unshieldedAddress,
    unshieldedNightBalance: wallet.unshieldedNightBalance,
    formattedUnshieldedNightBalance: wallet.formattedUnshieldedNightBalance,
    dustBalance: wallet.dustBalance,
    formattedDustBalance: wallet.formattedDustBalance,
    formattedAddress: wallet.formattedAddress,
    connectWallet: wallet.connectWallet,
    disconnectWallet: wallet.disconnectWallet,
    refreshBalance: wallet.refreshBalance,

    // Contract
    isContractInitialized: contract.isInitialized,
    isContractInitializing: contract.isInitializing,
    protocolInitialized: contract.protocolInitialized,
    marketCount: contract.marketCount,
    wagerCount: contract.wagerCount,
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
