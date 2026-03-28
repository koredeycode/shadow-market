import { ConnectedAPI, type InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import {
  ShieldedAddress,
  ShieldedCoinPublicKey,
  ShieldedEncryptionPublicKey,
} from '@midnight-ntwrk/wallet-sdk-address-format';
import { useCallback, useEffect, useRef } from 'react';

import toast from 'react-hot-toast';
import semver from 'semver';
import { authApi } from '../api/auth';
import { useContractStore } from '../store/contract.store';
import { useWalletStore } from '../store/wallet.store';

// Declare global window types for Lace wallet
declare global {
  interface Window {
    midnight?: { [key: string]: InitialAPI };
  }
}

const COMPATIBLE_CONNECTOR_API_VERSION = '4.x';
const NETWORK_ID = (import.meta as any).env?.VITE_NETWORK_ID || 'undeployed';

// Find the first compatible Lace wallet from window.midnight object
const getFirstCompatibleWallet = (): InitialAPI | undefined => {
  if (!window.midnight) return undefined;

  return Object.values(window.midnight).find(
    (wallet): wallet is InitialAPI =>
      !!wallet &&
      typeof wallet === 'object' &&
      'apiVersion' in wallet &&
      semver.satisfies(wallet.apiVersion, COMPATIBLE_CONNECTOR_API_VERSION)
  );
};

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

  const { initialize: initializeContract, cleanup: cleanupContract } = useContractStore();

  const connectedAPIRef = useRef<ConnectedAPI | null>(null);

  // Check if Lace wallet is installed
  const isWalletInstalled = useCallback(() => {
    return typeof window !== 'undefined' && !!getFirstCompatibleWallet();
  }, []);

  // Connect to wallet
  const connectWallet = useCallback(async () => {
    if (!isWalletInstalled()) {
      toast.error('Lace wallet not found. Please install Lace wallet extension.');
      window.open('https://www.lace.io/', '_blank');
      return;
    }

    if (isConnecting || isConnected) return;

    setConnecting(true);

    try {
      const initialAPI = getFirstCompatibleWallet();

      if (!initialAPI) {
        throw new Error('Could not find compatible Midnight Lace wallet');
      }

      console.log('Connecting to Lace wallet with network:', NETWORK_ID);

      // Connect to wallet with network ID
      const connectedAPI = await initialAPI.connect(NETWORK_ID);
      connectedAPIRef.current = connectedAPI;

      // Get connection status and configuration
      const connectionStatus = await connectedAPI.getConnectionStatus();
      console.log('Connection status:', connectionStatus);

      const shieldedAddresses = await connectedAPI.getShieldedAddresses();
      console.log('Shielded addresses:', shieldedAddresses);

      // Convert hex public keys to Bech32m formatted address if they are returned as hex
      let walletAddress = shieldedAddresses.shieldedAddress;

      // If shieldedAddress is identical to coinPublicKey, it's likely raw hex and needs formatting
      if (walletAddress === shieldedAddresses.shieldedCoinPublicKey) {
        console.log('Formatting hex address to Bech32m...');
        try {
          const coinPublicKey = ShieldedCoinPublicKey.fromHexString(
            shieldedAddresses.shieldedCoinPublicKey
          );
          const encryptionPublicKey = ShieldedEncryptionPublicKey.fromHexString(
            shieldedAddresses.shieldedEncryptionPublicKey
          );
          const fullShieldedAddress = new ShieldedAddress(coinPublicKey, encryptionPublicKey);
          walletAddress = ShieldedAddress.codec.encode(NETWORK_ID, fullShieldedAddress).toString();
          console.log('Formatted address:', walletAddress);
        } catch (e) {
          console.error('Failed to format shielded address:', e);
          // Fallback to what we have if formatting fails
        }
      }

      // Get balance (placeholder - might need different method)
      const walletBalance = '0'; // TODO: Implement balance fetching

      connect(connectedAPI, walletAddress, NETWORK_ID);
      updateBalance(walletBalance);

      // Authenticate user with backend (create account if doesn't exist)
      try {
        console.log('🔐 Authenticating user with backend...');
        const authResponse = await authApi.authenticate({ address: walletAddress });

        // Store JWT token in localStorage
        localStorage.setItem('authToken', authResponse.token);

        console.log('✅ User authenticated:', authResponse.user.id);
        console.log('   Address:', authResponse.user.address);
        if (authResponse.user.username) {
          console.log('   Username:', authResponse.user.username);
        }
      } catch (authError) {
        console.error('⚠️ User authentication failed:', authError);
        // Don't fail wallet connection if auth fails - user can retry
        toast.error('Failed to authenticate with backend. Some features may not work.');
      }

      // Initialize contract connection
      // Note: SDK v4 doesn't expose getPrivateStateProvider on ConnectedAPI
      // Private state management is handled internally by the wallet now
      try {
        await initializeContract(connectedAPI);
        console.log('✅ Contract initialized');
      } catch (error) {
        console.error('⚠️ Contract initialization failed:', error);
        // Don't fail wallet connection if contract init fails
      }

      toast.success('Wallet connected successfully!');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to connect wallet. Please try again.';
      toast.error(errorMessage);
      setConnecting(false);
    }
  }, [isWalletInstalled, connect, updateBalance, setConnecting, isConnecting, isConnected]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    connectedAPIRef.current = null;
    cleanupContract();
    disconnect();

    // Clear auth token
    localStorage.removeItem('authToken');
    console.log('🔐 Auth token cleared');

    toast.success('Wallet disconnected');
  }, [disconnect, cleanupContract]);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!isConnected || !connectedAPIRef.current) return;

    try {
      // TODO: Implement balance refresh when API method is available
      // The DApp Connector API might provide balance through getConfiguration()
      const newBalance = '0';
      updateBalance(newBalance);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  }, [isConnected, updateBalance]);

  // Sign and submit transaction
  const signTransaction = useCallback(
    async (transaction: any) => {
      if (!isConnected || !connectedAPIRef.current) {
        throw new Error('Wallet not connected');
      }

      try {
        // Use ConnectedAPI's transaction methods
        const txHash = await connectedAPIRef.current.submitTransaction(transaction);
        return txHash;
      } catch (error) {
        console.error('Failed to sign/submit transaction:', error);
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

  // Format address for display (first 8...last 6 chars)
  const formattedAddress = useCallback(() => {
    if (!address) return '';
    if (address.length <= 20) return address;
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  }, [address]);

  // Setup event listeners for account/network changes
  useEffect(() => {
    // TODO: Check if ConnectedAPI provides event listeners for state changes
    // The DApp Connector API v4.0 may handle this differently
    // For now, event listeners are not implemented

    // Cleanup on unmount
    return () => {
      // Cleanup if needed
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
    isWalletModalOpen: useWalletStore(s => s.isWalletModalOpen),
    setWalletModalOpen: useWalletStore(s => s.setWalletModalOpen),
  };
}
