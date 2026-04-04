import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { wagersApi } from '../../api/wagers';
import { useContract } from '../../hooks/useContract';
import { useWallet } from '../../hooks/useWallet';
import { Market } from '../../types';
import { TxSuccessModal } from '../common/TxSuccessModal';

const betSchema = z.object({
  amount: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Amount must be greater than 0',
  }),
  side: z.enum(['yes', 'no']),
  slippage: z.number().min(0.1).max(50).default(1),
});

type BetFormData = z.infer<typeof betSchema>;

interface BettingTerminalProps {
  market: Market;
}

export function BettingTerminal({ market }: BettingTerminalProps) {
  const { isConnected, formattedUnshieldedNightBalance, setWalletModalOpen } = useWallet();
  const { placeBet, isInitialized } = useContract();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ txHash: string; amount: string; side: string } | null>(null);

  // Prevent any accidental navigation
  useEffect(() => {
    console.log('BettingTerminal mounted');

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSubmitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      console.log('BettingTerminal unmounted');
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isSubmitting]);

  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BetFormData>({
    resolver: zodResolver(betSchema),
    defaultValues: {
      amount: '',
      side: 'yes',
      slippage: 1,
    },
  });

  const amount = watch('amount');
  const side = watch('side');

  const estimate = useMemo(() => {
    if (!amount || isNaN(parseFloat(amount))) return null;

    const basePrice = side === 'yes' ? parseFloat(market.yesPrice) : parseFloat(market.noPrice);
    const betAmount = parseFloat(amount);

    // Fixed price logic (No AMM impact)
    const estimatedPrice = basePrice;
    const potentialPayout = betAmount / estimatedPrice;
    const potentialProfit = potentialPayout - betAmount;
    const returnPercentage = (potentialProfit / betAmount) * 100;

    return {
      estimatedPrice,
      priceImpact: 0,
      potentialPayout,
      potentialProfit,
      returnPercentage,
    };
  }, [amount, side, market]);

  const mutation = useMutation({
    mutationFn: async (data: BetFormData) => {
      try {
        // ENFORCE on-chain transactions - wallet and contract must be ready
        if (!isConnected) {
          throw new Error(
            'Wallet not connected. Please connect your Midnight wallet to place bets.'
          );
        }

        if (!isInitialized) {
          throw new Error(
            'Contract not initialized. Please reconnect your wallet or check your network configuration.'
          );
        }

        console.log('Placing bet ON-CHAIN (required)...');

        // Step 1: REQUIRED - Execute on-chain transaction first
        const result = await placeBet(
          market.onchainId || market.id,
          data.side.toUpperCase() as 'YES' | 'NO',
          parseFloat(data.amount)
        );

        if (!result) throw new Error('Transaction failed or was cancelled');
        const { txHash, onchainId } = result;

        console.log('On-chain transaction successful! Hash:', txHash);

        // Step 2: Update backend database for caching/indexing (after on-chain success)
        console.log('Syncing to database...');
        try {
          const dbResult = await wagersApi.placeBet({
            marketId: market.id,
            amount: data.amount,
            side: data.side,
            slippage: data.slippage,
            txHash,
            onchainId,
            skipRedirect: true,
          });

          console.log('Database synced successfully');
          return { ...dbResult, txId: txHash, contractSuccess: true };
        } catch (dbError) {
          // On-chain succeeded but database update failed - this is acceptable
          console.warn('Database sync failed (on-chain transaction succeeded):', dbError);
          return { positionId: market.id, txId: txHash, contractSuccess: true };
        }
      } catch (error: any) {
        console.error('Mutation error caught:', error);
        throw error;
      }
    },
    onSuccess: data => {
      try {
        console.log('Mutation onSuccess triggered, updating UI...');
        console.log('Success data:', data);

        setSuccessData({
          txHash: data.txId || '',
          amount: watch('amount'),
          side: watch('side').toUpperCase()
        });

        // Clear form
        setValue('amount', '');

        console.log('UI update complete - NOT invalidating queries to prevent navigation');
      } catch (error) {
        console.error('Error in onSuccess handler:', error);
        // Don't re-throw - just log it
      }
    },
    onError: (error: any) => {
      console.error('On-chain bet placement failed:', error);
      // Redundant toast removed as executeTx handles it
    },
  });

  const onSubmit = async (data: BetFormData) => {
    try {
      console.log('Form submitted with data:', data);

      if (!isConnected) {
        console.log('Wallet not connected, opening modal');
        setWalletModalOpen(true);
        return;
      }

      console.log('Starting mutation...');
      setIsSubmitting(true);
      try {
        await mutation.mutateAsync(data);
        console.log('Mutation completed successfully');
      } catch (error) {
        console.error('Mutation failed:', error);
        // Error is already handled by mutation.onError
        // Don't re-throw - we've already shown the error toast
      } finally {
        setIsSubmitting(false);
        console.log('Mutation finished');
      }
    } catch (error) {
      console.error('Unexpected error in onSubmit:', error);
      setIsSubmitting(false);
      toast.error('An unexpected error occurred. Please try again.');
      // Don't re-throw - prevents ErrorBoundary from catching it
    }
  };

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-sm overflow-hidden flex flex-col h-full backdrop-blur-md">
      <div className="p-1 border-b border-white/10 bg-black/40 flex">
        <button
          type="button"
          onClick={() => setValue('side', 'yes')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 transition-all ${
            side === 'yes'
              ? 'bg-success-green/10 text-success-green border-b-2 border-success-green'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span className="font-bold text-sm tracking-wider uppercase">Position: Yes</span>
        </button>
        <button
          type="button"
          onClick={() => setValue('side', 'no')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 transition-all ${
            side === 'no'
              ? 'bg-red-500/10 text-red-500 border-b-2 border-red-500'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span className="font-bold text-sm tracking-wider uppercase">Position: No</span>
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              Input amount
            </label>
            <span className="text-[10px] font-mono text-slate-400">
              Balance: <span className="text-white">{isConnected ? formattedUnshieldedNightBalance : '--'}</span>{' '}
              NIGHT
            </span>
          </div>
          <div className="relative group">
            <input
              {...control.register('amount')}
              type="number"
              step="any"
              placeholder="0.00"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  // Trigger programmatic submit
                  const formData = { amount, side, slippage: 1 };
                  onSubmit(formData).catch(console.error);
                }
              }}
              className={`w-full bg-slate-950 border ${errors.amount ? 'border-red-500/50' : 'border-white/10 group-focus-within:border-electric-blue/50'} p-4 rounded-sm font-mono text-2xl text-white focus:outline-none transition-all`}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs font-bold">
              NIGHT
            </div>
          </div>
          {errors.amount && (
            <p className="text-red-400 text-[10px] font-mono uppercase mt-1">
              {errors.amount.message}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            {[10, 50, 100, 500].map(qty => (
              <button
                key={qty}
                type="button"
                onClick={() => setValue('amount', qty.toString())}
                className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-sm text-[10px] font-mono text-slate-400 hover:text-white transition-all uppercase"
              >
                +{qty}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="bg-slate-950/80 border border-white/5 p-4 rounded-sm space-y-3">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-slate-400">
              Potential reward
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-mono text-success-green font-bold leading-none">
                {estimate ? `+${estimate.potentialProfit.toFixed(2)}` : '0.00'}
                <span className="text-xs ml-1 font-light opacity-50">NIGHT</span>
              </div>
              <div className="text-[10px] font-mono bg-success-green/10 text-success-green px-2 py-0.5 rounded-sm border border-success-green/20">
                {estimate ? `+${estimate.returnPercentage.toFixed(1)}%` : '--'}
              </div>
            </div>
          </div>
        </div>



        <button
          type="button"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Button clicked');

            if (!isConnected) {
              console.log('Wallet not connected, opening modal');
              setWalletModalOpen(true);
              return;
            }

            if (!amount || parseFloat(amount) <= 0) {
              console.log('Invalid amount, skipping submission');
              return;
            }

            console.log('Calling onSubmit with form data');
            const formData = { amount, side, slippage: 1 };

            // Call onSubmit without await to prevent any async issues
            onSubmit(formData).catch(err => {
              console.error('onSubmit error:', err);
            });
          }}
          disabled={isSubmitting || (isConnected && (!amount || parseFloat(amount) <= 0))}
          className={`w-full py-4 rounded-sm font-bold text-sm tracking-[0.2em] relative group overflow-hidden transition-all ${
            !isConnected
              ? 'bg-electric-blue text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
              : side === 'yes'
                ? 'bg-success-green text-black hover:bg-success-green/90 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                : 'bg-red-500 text-white hover:bg-red-500/90 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
          } disabled:opacity-50 disabled:shadow-none disabled:bg-slate-800 disabled:text-slate-500`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Zap className="w-4 h-4 animate-pulse" />
              Executing transaction...
            </span>
          ) : !isConnected ? (
            'Connect wallet'
          ) : (
            `Place ${side} wager`
          )}

          <div className="absolute inset-0 bg-white opacity-0 group-active:opacity-20 transition-opacity" />
        </button>
      </div>
      <TxSuccessModal 
        isOpen={!!successData}
        onClose={() => setSuccessData(null)}
        txHash={successData?.txHash || ''}
        title="Position Secured"
        subtitle={`Successfully placed your ${successData?.amount} NIGHT ${successData?.side} bet. Your position is now locked in the ZK-escrow.`}
        primaryAction={{
          label: 'Acknowledge',
          onClick: () => setSuccessData(null)
        }}
      />
    </div>
  );
}
