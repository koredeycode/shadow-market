import { useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useWalletStore } from '../store/wallet.store';

// Declare Lace wallet types
declare global {
  interface Window {
    midnight?: {
      isLace?: boolean;
      enable: () => Promise<any>;
      getAddress: () => Promise<string>;
      getBalance: () => Promise<string>;
      getNetworkId: () => Promise<string>;
      signTransaction: (tx: any) => Promise<any>;
      on?: (event: string, handler: (...args: any[]) => void) => void;
      off?: (event: string, handler: (...args: any[]) => void) => void;
    };
  }
}

export function useWallet() {
  const {
    isConnected,
    isConnecting,
    address,
    balance,
    networkId,
    provider,
    connect,
    disconnect,
    updateBalance,
    setConnecting,
  } = useWalletStore();

  // Check if Lace wallet is installed
  const isWalletInstalled = useCallback(() => {
    return typeof window !== 'undefined' && !!window.midnight;
  }, []);

  // Connect to wallet
  const connectWallet = useCallback(async () => {
    if (!isWalletInstalled()) {
      toast.error('Lace wallet not found. Please install Lace wallet extension.');
      window.open('https://www.lace.io/', '_blank');
      return;
    }

    setConnecting(true);

    try {
      // Enable wallet
      const walletProvider = await window.midnight!.enable();

      // Get wallet details
      const [walletAddress, walletBalance, walletNetworkId] = await Promise.all([
        window.midnight!.getAddress(),
        window.midnight!.getBalance(),
        window.midnight!.getNetworkId(),
      ]);

      // Validate network
      const expectedNetworkId = import.meta.env.VITE_NETWORK_ID || 'undeployed';
      if (walletNetworkId !== expectedNetworkId) {
        toast.error(`Wrong network. Please switch to ${expectedNetworkId} network in Lace wallet.`);
        setConnecting(false);
        return;
      }

      // Connect to store
      connect(walletProvider, walletAddress, walletNetworkId);
      updateBalance(walletBalance);

      toast.success('Wallet connected successfully!');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast.error('Failed to connect wallet. Please try again.');
      setConnecting(false);
    }
  }, [isWalletInstalled, connect, updateBalance, setConnecting]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    disconnect();
    toast.success('Wallet disconnected');
  }, [disconnect]);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!isConnected || !window.midnight) return;

    try {
      const newBalance = await window.midnight.getBalance();
      updateBalance(newBalance);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  }, [isConnected, updateBalance]);

  // Sign transaction
  const signTransaction = useCallback(
    async (transaction: any) => {
      if (!isConnected || !window.midnight) {
        throw new Error('Wallet not connected');
      }

      try {
        const signedTx = await window.midnight.signTransaction(transaction);
        return signedTx;
      } catch (error) {
        console.error('Failed to sign transaction:', error);
        throw error;
      }
    },
    [isConnected]
  );

  // Format balance for display
  const formattedBalance = useCallback(() => {
    if (!balance) return '0';
    const num = parseFloat(balance);
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
    return num.toFixed(2);
  }, [balance]);

  // Format address for display (0x1234...5678)
  const formattedAddress = useCallback(() => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address]);

  // Setup event listeners for account/network changes
  useEffect(() => {
    if (!window.midnight?.on) return;

    const handleAccountsChanged = () => {
      // Disconnect and prompt user to reconnect
      disconnect();
      toast.info('Account changed. Please reconnect your wallet.');
    };

    const handleNetworkChanged = () => {
      // Disconnect and prompt user to reconnect
      disconnect();
      toast.info('Network changed. Please reconnect your wallet.');
    };

    window.midnight.on('accountsChanged', handleAccountsChanged);
    window.midnight.on('networkChanged', handleNetworkChanged);

    return () => {
      if (window.midnight?.off) {
        window.midnight.off('accountsChanged', handleAccountsChanged);
        window.midnight.off('networkChanged', handleNetworkChanged);
      }
    };
  }, [disconnect]);

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      refreshBalance();
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected, refreshBalance]);

  return {
    // State
    isConnected,
    isConnecting,
    address,
    balance,
    networkId,
    provider,
    isWalletInstalled: isWalletInstalled(),

    // Computed
    formattedBalance: formattedBalance(),
    formattedAddress: formattedAddress(),

    // Actions
    connectWallet,
    disconnectWallet,
    refreshBalance,
    signTransaction,
  };
}
