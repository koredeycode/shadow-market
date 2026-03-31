import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { contractManager } from '../services/contract.service';
import { useContractStore } from '../store/contract.store';

/**
 * Hook for interacting with the unified prediction market contract
 * Now using the BBoard-style API wrapper pattern
 */
export function useContract() {
  const { isInitialized, isInitializing, protocolInitialized, error } = useContractStore();

  // Place a bet on a market
  const placeBet = useCallback(
    async (marketId: string, side: 'YES' | 'NO', amount: number) => {
      if (!isInitialized) {
        throw new Error('Contract not initialized. Please reconnect your wallet.');
      }

      const betAmount = BigInt(amount);
      const betOutcome = side === 'YES';

      // Call contract - returns txHash
      const txHash = await contractManager.placeBet(marketId, betAmount, betOutcome);

      return txHash;
    },
    [isInitialized]
  );

  // Create a new market
  const createMarket = useCallback(
    async (_marketId: string, question: string, resolverAddress: string, endTime: Date) => {
      if (!isInitialized) {
        toast.error('Contract not initialized. Please reconnect your wallet.');
        return null;
      }

      try {
        const onchainEndTime = BigInt(Math.floor(endTime.getTime() / 1000));
        const initialLiquidity = 100n; // Default initial liquidity
        const oracleAddress = resolverAddress;

        toast.loading('Creating market...');

        const txHash = await contractManager.createMarket(
          question,
          onchainEndTime,
          initialLiquidity,
          oracleAddress
        );

        toast.dismiss();
        toast.success(`Market created successfully! Tx: ${txHash.slice(0, 10)}...`);
        return txHash;
      } catch (error: any) {
        toast.dismiss();
        toast.error(error.message || 'Failed to create market');
        console.error('Create market error:', error);
        return null;
      }
    },
    [isInitialized]
  );

  // P2P Wager methods - Not yet implemented in simplified API
  // TODO: Add back when P2P betting is implemented
  const createWager = useCallback(async (..._args: any[]) => {
    toast.error('P2P wagers not yet implemented');
    return null;
  }, []);

  const acceptWager = useCallback(async (_wagerId: string) => {
    toast.error('P2P wagers not yet implemented');
    return null;
  }, []);

  const cancelWager = useCallback(async (_wagerId: string) => {
    toast.error('P2P wagers not yet implemented');
    return null;
  }, []);

  // Claim pool winnings - maps to claimWinnings
  const claimPoolWinnings = useCallback(
    async (betId: string) => {
      if (!isInitialized) {
        toast.error('Contract not initialized. Please reconnect your wallet.');
        return null;
      }

      try {
        toast.loading('Claiming winnings...');

        await contractManager.claimWinnings(betId);

        toast.dismiss();
        toast.success('Winnings claimed!');
        return true;
      } catch (error: any) {
        toast.dismiss();
        toast.error(error.message || 'Failed to claim winnings');
        console.error('Claim pool winnings error:', error);
        return null;
      }
    },
    [isInitialized]
  );

  // Claim wager winnings - not yet implemented
  const claimWagerWinnings = useCallback(async (_wagerId: string) => {
    toast.error('P2P wagers not yet implemented');
    return null;
  }, []);

  // Get contract state - use subscription instead
  const getContractState = useCallback(async () => {
    if (!isInitialized) {
      return null;
    }

    // Contract state is available through subscribeToState
    // This method is kept for backward compatibility
    return { message: 'Use subscribeToState for reactive updates' };
  }, [isInitialized]);

  return {
    // State
    isInitialized,
    isInitializing,
    protocolInitialized,
    error,

    // Actions
    placeBet,
    createMarket,
    createWager,
    acceptWager,
    cancelWager,
    claimPoolWinnings,
    claimWagerWinnings,
    getContractState,
  };
}
