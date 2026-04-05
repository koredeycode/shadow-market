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
    address: shieldedAddress,
    unshieldedAddress,
    addressDisplayMode,
    nightBalance,
    unshieldedNightBalance,
    dustBalance,
    networkId,
    provider,
    isTransacting,
    autoConnect,
    username: storeUsername,
    connect: storeConnect,
    disconnect: storeDisconnect,
    updateBalances,
    setConnecting,
    setAddressDisplayMode,
  } = useWalletStore();

  const currentAddress = addressDisplayMode === 'shielded' ? shieldedAddress : (unshieldedAddress || shieldedAddress);

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
      const initialStatus = await connectedAPI.getConnectionStatus();
      const shieldedAddresses = await connectedAPI.getShieldedAddresses();

      // Helper to format hex to Bech32m if needed
      const formatHexToBech32 = (hexAddr: string, type: 'shielded' | 'unshielded') => {
        if (!hexAddr || hexAddr.startsWith('mn_')) return hexAddr;
        
        try {
          if (type === 'shielded') {
            const coinPublicKey = ShieldedCoinPublicKey.fromHexString(
              shieldedAddresses.shieldedCoinPublicKey
            );
            const encryptionPublicKey = ShieldedEncryptionPublicKey.fromHexString(
              shieldedAddresses.shieldedEncryptionPublicKey
            );
            const fullShieldedAddress = new ShieldedAddress(coinPublicKey, encryptionPublicKey);
            return ShieldedAddress.codec.encode(NETWORK_ID, fullShieldedAddress).toString();
          } else {
            const coinPublicKey = ShieldedCoinPublicKey.fromHexString(hexAddr);
            const encryptionPublicKey = ShieldedEncryptionPublicKey.fromHexString('0000000000000000000000000000000000000000000000000000000000000000');
            const fullUnshieldedAddress = new ShieldedAddress(coinPublicKey, encryptionPublicKey);
            const encoded = ShieldedAddress.codec.encode(NETWORK_ID, fullUnshieldedAddress).toString();
            // The codec should generate mn_ENVIRONMENT_shield-addr_1...
            // We want to replace 'shield-addr_' with 'addr_' for unshielded display
            return encoded.replace('shield-addr_', 'addr_');
          }
        } catch (e) {
          console.error(`Failed to format ${type} address:`, e);
          return hexAddr;
        }
      };

      // Convert hex public keys to Bech32m formatted address if they are returned as hex
      let shieldedAddressVal = formatHexToBech32(shieldedAddresses.shieldedAddress, 'shielded');
      
      // Attempt to get unshielded address using the correct method found in debug logs
      let unshieldedAddressVal = (initialStatus as any).status?.unshieldedAddress;

      if (!unshieldedAddressVal && typeof (connectedAPI as any).getUnshieldedAddress === 'function') {
        try {
          const result = await (connectedAPI as any).getUnshieldedAddress();
          unshieldedAddressVal = typeof result === 'object' && result !== null ? result.unshieldedAddress : result;
        } catch (e) {
          console.error('getUnshieldedAddress() failed', e);
        }
      }

      if (unshieldedAddressVal && typeof unshieldedAddressVal === 'string') {
        unshieldedAddressVal = formatHexToBech32(unshieldedAddressVal, 'unshielded');
      }

      // Get balances using specific methods if available
      let unshieldedBalance = '0';
      let dustBalance = '0';
      let shieldedBalance = '0';

      try {
        if (typeof (connectedAPI as any).getUnshieldedBalances === 'function') {
          const balances = await (connectedAPI as any).getUnshieldedBalances();
          const keys = Object.keys(balances || {});
          unshieldedBalance = balances?.['00']?.toString() || (keys.length > 0 ? balances[keys[0]].toString() : '0');
        } else {
          unshieldedBalance = (initialStatus as any).status?.balances?.['00']?.toString() || '0';
        }

        if (typeof (connectedAPI as any).getDustBalance === 'function') {
          const dust = await (connectedAPI as any).getDustBalance();
          if (typeof dust === 'object' && dust !== null && 'balance' in dust) {
            dustBalance = (dust as any).balance.toString();
          } else {
            dustBalance = dust?.toString() || '0';
          }
        } else {
          dustBalance = (initialStatus as any).status?.balances?.['dust']?.toString() || '0';
        }

        if (typeof (connectedAPI as any).getShieldedBalances === 'function') {
          const balances = await (connectedAPI as any).getShieldedBalances();
          shieldedBalance = balances?.['00']?.toString() || '0';
        }
      } catch (e) {
        console.error('Failed to fetch balances:', e);
      }

      console.log('DEBUG: Initial Balances (Raw):', {
        shielded: shieldedBalance,
        unshielded: unshieldedBalance,
        dust: dustBalance
      });

      updateBalances({
        night: String(shieldedBalance),
        unshieldedNight: String(unshieldedBalance),
        dust: String(dustBalance),
      });

      let usernameVal = '';
      // Authenticate user with backend (create account if doesn't exist)
      try {
        const authAddress = unshieldedAddressVal || shieldedAddressVal;
        console.log('Authenticating user with backend using address:', authAddress);
        const authResponse = await authApi.authenticate({ address: authAddress });
        usernameVal = authResponse.user.username || '';

        // Store JWT token in localStorage
        localStorage.setItem('authToken', authResponse.token);

        console.log('User authenticated:', authResponse.user.id);
        console.log('   Address:', authResponse.user.address);
        if (authResponse.user.username) {
          console.log('   Username:', authResponse.user.username);
        }
      } catch (authError) {
        console.error('User authentication failed:', authError);
        // Don't fail wallet connection if auth fails - user can retry
        toast.error('Failed to authenticate with backend. Some features may not work.');
      }

      storeConnect(connectedAPI, { shielded: shieldedAddressVal, unshielded: unshieldedAddressVal }, NETWORK_ID, usernameVal);

      // Initialize contract connection
      // Note: SDK v4 doesn't expose getPrivateStateProvider on ConnectedAPI
      // Private state management is handled internally by the wallet now
      let contractInitialized = false;
      try {
        const result = await initializeContract(connectedAPI, {
          shieldedCoinPublicKey: shieldedAddresses.shieldedCoinPublicKey,
          shieldedEncryptionPublicKey: shieldedAddresses.shieldedEncryptionPublicKey,
        });
        contractInitialized = result === true;
        if (contractInitialized) {
          console.log('Contract initialized successfully');
        } else {
          console.error('Contract initialization returned false');
        }
      } catch (error) {
        console.error('Contract initialization failed with exception:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Contract initialization failed: ${errorMsg}`);
      }

      if (contractInitialized) {
        toast.success('Wallet connected successfully!');
      } else {
        toast('Wallet connected but contract initialization failed. Please try reconnecting.');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to connect wallet. Please try again.';
      toast.error(errorMessage);
      setConnecting(false);
    }
  }, [isWalletInstalled, storeConnect, updateBalances, setConnecting, isConnecting, isConnected, initializeContract]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    connectedAPIRef.current = null;
    cleanupContract();
    storeDisconnect();

    // Clear auth token
    localStorage.removeItem('authToken');
    console.log('Auth token cleared');

    toast.success('Wallet disconnected');
  }, [storeDisconnect, cleanupContract]);

  // Refresh balances
  const refreshBalance = useCallback(async () => {
    const connectedAPI = connectedAPIRef.current;
    if (!connectedAPI || useWalletStore.getState().isTransacting) return;

    try {
      let unshieldedNight = '0';
      let dust = '0';
      let night = '0';

      if (typeof (connectedAPI as any).getUnshieldedBalances === 'function') {
        const balances = await (connectedAPI as any).getUnshieldedBalances();
        const keys = Object.keys(balances || {});
        unshieldedNight = balances?.['00']?.toString() || (keys.length > 0 ? balances[keys[0]].toString() : '0');
      } else {
        const status = await connectedAPI.getConnectionStatus();
        const balances = (status as any).status?.balances || {};
        const keys = Object.keys(balances);
        unshieldedNight = balances?.['00']?.toString() || (keys.length > 0 ? balances[keys[0]].toString() : '0');
      }

      if (typeof (connectedAPI as any).getDustBalance === 'function') {
        const dustResult = await (connectedAPI as any).getDustBalance();
        if (typeof dustResult === 'object' && dustResult !== null && 'balance' in dustResult) {
          dust = (dustResult as any).balance.toString();
        } else {
          dust = dustResult?.toString() || '0';
        }
      } else {
        const status = await connectedAPI.getConnectionStatus();
        dust = (status as any).status?.balances?.['dust']?.toString() || '0';
      }

      if (typeof (connectedAPI as any).getShieldedBalances === 'function') {
        const balances = await (connectedAPI as any).getShieldedBalances();
        night = balances?.['00']?.toString() || '0';
      }

      console.log('DEBUG: Refreshed Balances:', {
        night,
        unshieldedNight,
        dust
      });

      updateBalances({
        night,
        unshieldedNight,
        dust,
      });
    } catch (e) {
      console.error('Failed to refresh balances:', e);
    }
  }, [updateBalances]);

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

  // Format address for display (prefix...suffix)
  const formattedAddress = useCallback(() => {
    const addr = currentAddress;
    if (!addr) return '';
    
    // Improved formatting for Midnight network prefixes (e.g., mn_shield-addr_preview1...)
    if (addr.includes('shield-addr_')) {
      const parts = addr.split('shield-addr_');
      const networkPart = parts[1].split('1')[0];
      return `${parts[0]}shield-${networkPart}...${addr.slice(-6)}`;
    }
    if (addr.includes('addr_')) {
      const parts = addr.split('addr_');
      const networkPart = parts[1].split('1')[0];
      return `${parts[0]}addr-${networkPart}...${addr.slice(-6)}`;
    }

    if (addr.length <= 20) return addr;
    return `${addr.slice(0, 12)}...${addr.slice(-6)}`;
  }, [currentAddress]);

  // Setup event listeners for account/network changes
  useEffect(() => {
    // TODO: Check if ConnectedAPI provides event listeners for state changes
    // The DApp Connector API v4.0 may handle this differently
    // For now, event listeners are not implemented

    // Cleanup on unmount
    return () => {
      // Cleanup if needed
    };
  }, [disconnectWallet]);

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    if (!isConnected || isTransacting) return;

    const interval = setInterval(() => {
      refreshBalance();
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected, isTransacting, refreshBalance]);
  
  // Auto-connect on mount if previously connected
  useEffect(() => {
    if (!isConnected && !isConnecting && autoConnect) {
      console.log('DEBUG: Auto-connecting wallet...');
      connectWallet();
    }
  }, []);

  return {
    // State
    isConnected,
    isConnecting,
    address: currentAddress,
    shieldedAddress,
    unshieldedAddress,
    addressDisplayMode,
    nightBalance,
    unshieldedNightBalance,
    dustBalance,
    networkId,
    provider,
    username: storeUsername,
    isWalletInstalled: isWalletInstalled(),

    // Computed
    formattedNightBalance: (Number(String(nightBalance || '0').replace(/[^0-9.]/g, '')) / 1_000_000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
    formattedUnshieldedNightBalance: (Number(String(unshieldedNightBalance || '0').replace(/[^0-9.]/g, '')) / 1_000_000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
    formattedDustBalance: (Number(String(dustBalance || '0').replace(/[^0-9.]/g, '')) / 1_000_000_000_000_000).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
    formattedAddress: formattedAddress(),

    // Actions
    connectWallet,
    disconnectWallet,
    refreshBalance,
    signTransaction,
    setAddressDisplayMode,
    isWalletModalOpen: useWalletStore(s => s.isWalletModalOpen),
    setWalletModalOpen: useWalletStore(s => s.setWalletModalOpen),
  };
}
