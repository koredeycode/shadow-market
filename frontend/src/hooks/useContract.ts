import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { contractManager } from '../services/contract.service';
import { useContractStore } from '../store/contract.store';

/**
 * Hook for interacting with the unified prediction market contract
 * Now using the BBoard-style API wrapper pattern
 */
export function useContract() {
  const { isInitialized, isInitializing, error } = useContractStore();

  // Place a bet on a market
  const placeBet = useCallback(
    async (marketId: string, side: 'YES' | 'NO', amount: number) => {
      if (!isInitialized) {
        throw new Error('Contract not initialized. Please reconnect your wallet.');
      }

      const betAmount = BigInt(amount);
      const betOutcome = side === 'YES';

      // Call contract - errors will propagate with detailed messages
      await contractManager.placeBet(marketId, betAmount, betOutcome);

      // Return transaction details (to be implemented with real SDK)
      return { success: true };
    },
    [isInitialized]
  );

  // Create a new market
  const createMarket = useCallback(
    async (marketId: string, question: string, resolverAddress: string, endTime: Date) => {
      if (!isInitialized) {
        toast.error('Contract not initialized. Please reconnect your wallet.');
        return null;
      }

      try {
        const questionHash = new TextEncoder().encode(question);
        const onchainEndTime = BigInt(Math.floor(endTime.getTime() / 1000));

        toast.loading('Creating market...');

        await contractManager.createMarket(marketId, questionHash, resolverAddress, onchainEndTime);

        toast.dismiss();
        toast.success('Market created successfully!');
        return true;
      } catch (error: any) {
        toast.dismiss();
        toast.error(error.message || 'Failed to create market');
        console.error('Create market error:', error);
        return null;
      }
    },
    [isInitialized]
  );

  // Create a P2P wager
  const createWager = useCallback(
    async (
      wagerId: string,
      question: string,
      makerStake: number,
      takerStake: number,
      makerPrediction: boolean,
      expiryTime: Date
    ) => {
      if (!isInitialized) {
        toast.error('Contract not initialized. Please reconnect your wallet.');
        return null;
      }

      try {
        const questionHash = new TextEncoder().encode(question);
        const onchainMakerStake = BigInt(makerStake);
        const onchainTakerStake = BigInt(takerStake);
        const onchainExpiryTime = BigInt(Math.floor(expiryTime.getTime() / 1000));

        toast.loading('Creating wager...');

        await contractManager.createWager(
          wagerId,
          questionHash,
          onchainMakerStake,
          onchainTakerStake,
          makerPrediction,
          onchainExpiryTime
        );

        toast.dismiss();
        toast.success('Wager created successfully!');
        return true;
      } catch (error: any) {
        toast.dismiss();
        toast.error(error.message || 'Failed to create wager');
        console.error('Create wager error:', error);
        return null;
      }
    },
    [isInitialized]
  );

  // Accept a P2P wager
  const acceptWager = useCallback(
    async (wagerId: string) => {
      if (!isInitialized) {
        toast.error('Contract not initialized. Please reconnect your wallet.');
        return null;
      }

      try {
        toast.loading('Accepting wager...');

        await contractManager.acceptWager(wagerId);

        toast.dismiss();
        toast.success('Wager accepted!');
        return true;
      } catch (error: any) {
        toast.dismiss();
        toast.error(error.message || 'Failed to accept wager');
        console.error('Accept wager error:', error);
        return null;
      }
    },
    [isInitialized]
  );

  // Cancel a P2P wager
  const cancelWager = useCallback(
    async (wagerId: string) => {
      if (!isInitialized) {
        toast.error('Contract not initialized. Please reconnect your wallet.');
        return null;
      }

      try {
        toast.loading('Cancelling wager...');

        await contractManager.cancelWager(wagerId);

        toast.dismiss();
        toast.success('Wager cancelled');
        return true;
      } catch (error: any) {
        toast.dismiss();
        toast.error(error.message || 'Failed to cancel wager');
        console.error('Cancel wager error:', error);
        return null;
      }
    },
    [isInitialized]
  );

  // Claim pool winnings
  const claimPoolWinnings = useCallback(
    async (marketId: string) => {
      if (!isInitialized) {
        toast.error('Contract not initialized. Please reconnect your wallet.');
        return null;
      }

      try {
        toast.loading('Claiming winnings...');

        await contractManager.claimPoolWinnings(marketId);

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

  // Claim wager winnings
  const claimWagerWinnings = useCallback(
    async (wagerId: string) => {
      if (!isInitialized) {
        toast.error('Contract not initialized. Please reconnect your wallet.');
        return null;
      }

      try {
        toast.loading('Claiming winnings...');

        await contractManager.claimWagerWinnings(wagerId);

        toast.dismiss();
        toast.success('Winnings claimed!');
        return true;
      } catch (error: any) {
        toast.dismiss();
        toast.error(error.message || 'Failed to claim winnings');
        console.error('Claim wager winnings error:', error);
        return null;
      }
    },
    [isInitialized]
  );

  // Get contract state
  const getContractState = useCallback(async () => {
    if (!isInitialized) {
      return null;
    }

    try {
      const state = await contractManager.getState();
      return state;
    } catch (error: any) {
      console.error('Get contract state error:', error);
      return null;
    }
  }, [isInitialized]);

  return {
    // State
    isInitialized,
    isInitializing,
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
