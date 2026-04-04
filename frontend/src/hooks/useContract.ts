import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { contractManager } from '../services/contract.service';
import { useContractStore } from '../store/contract.store';

/**
 * Hook for interacting with the unified prediction market contract
 * Now using the BBoard-style API wrapper pattern
 */
export function useContract() {
  const { isInitialized, isInitializing, protocolInitialized, marketCount, wagerCount, error } = useContractStore();

  // Place a bet on a market
  const placeBet = useCallback(
    async (marketId: string, side: 'YES' | 'NO', amount: number) => {
      if (!isInitialized) {
        throw new Error('Contract not initialized. Please reconnect your wallet.');
      }

      const betAmount = BigInt(Math.floor(amount * 1_000_000));
      const betOutcome = side === 'YES';

      // Call contract - returns { txHash, onchainId }
      const result = await contractManager.placeBet(marketId, betAmount, betOutcome);

      return result;
    },
    [isInitialized]
  );

  // Create a new market
  const createMarket = useCallback(
    async (_marketId: string, question: string, endTime: Date) => {
      if (!isInitialized) {
        toast.error('Contract not initialized. Please reconnect your wallet.');
        return null;
      }

      try {
        console.log('DEBUG: useContract.createMarket hook called:', { question, endTime });
        const onchainEndTime = BigInt(Math.floor(endTime.getTime() / 1000));

        console.log('DEBUG: Calling contractManager.createMarket...');
        const startTime = Date.now();
        const result = await contractManager.createMarket(
          question,
          onchainEndTime
        );
        const totalTime = Date.now() - startTime;

        console.log(`DEBUG: contractManager.createMarket returned in ${(totalTime / 1000).toFixed(2)}s:`, result);
        return result;
      } catch (error: any) {
        console.error('DEBUG: useContract.createMarket caught error:', error);
        // Error toast is already handled by contractManager.executeTx
        return null;
      }
    },
    [isInitialized]
  );

  // P2P Wager methods
  const createWager = useCallback(
    async (marketId: string, side: 'YES' | 'NO', amount: number, odds: [number, number]) => {
      if (!isInitialized) {
        toast.error('Contract not initialized. Please reconnect your wallet.');
        return null;
      }

      try {
        const betAmount = BigInt(Math.floor(amount * 1_000_000));
        const betSide = side === 'YES';
        const [num, den] = odds;

        const result = await contractManager.createWager(
          marketId,
          betSide,
          betAmount,
          BigInt(num),
          BigInt(den)
        );

        return result;
      } catch (error: any) {
        // Redundant handling removed - executeTx handles toasts
        return null;
      }
    },
    [isInitialized]
  );

  const acceptWager = useCallback(async (wagerId: string) => {
    if (!isInitialized) {
      toast.error('Contract not initialized. Please reconnect your wallet.');
      return null;
    }
    return contractManager.acceptWager(wagerId);
  }, [isInitialized]);

  const cancelWager = useCallback(async (wagerId: string) => {
    if (!isInitialized) {
      toast.error('Contract not initialized. Please reconnect your wallet.');
      return null;
    }
    return contractManager.cancelWager(wagerId);
  }, [isInitialized]);

  // Claim pool winnings - maps to claimWinnings
  const claimPoolWinnings = useCallback(
    async (betId: string) => {
      if (!isInitialized) {
        toast.error('Contract not initialized. Please reconnect your wallet.');
        return null;
      }

      try {
        await contractManager.claimWinnings(betId);
        return true;
      } catch (error: any) {
        console.error('Claim pool winnings error:', error);
        return null;
      }
    },
    [isInitialized]
  );

  // Claim wager winnings - not yet implemented
  const claimWagerWinnings = useCallback(async (wagerId: string) => {
    if (!isInitialized) {
      toast.error('Contract not initialized. Please reconnect your wallet.');
      return null;
    }
    return contractManager.claimWagerWinnings(wagerId);
  }, [isInitialized]);

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
    marketCount,
    wagerCount,
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
