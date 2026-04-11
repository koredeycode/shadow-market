import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TrendingDown, TrendingUp, Zap, Loader2, Percent, Info } from 'lucide-react';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { useContract } from '../../hooks/useContract';
import { useWallet } from '../../hooks/useWallet';
import { Market } from '../../types';
import { wagersApi } from '../../api/wagers';
import { TxSuccessModal } from '../common/TxSuccessModal';
import toast from 'react-hot-toast';

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
  const { isConnected, unshieldedNightBalance, formattedUnshieldedNightBalance, setWalletModalOpen } = useWallet();
  const { placeBet, isInitialized } = useContract();
  const [successData, setSuccessData] = useState<{ txHash: string; amount: string; side: string } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    watch,
    setValue,
    control,
    handleSubmit,
    reset,
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

  const calculatePriceEstimate = () => {
    if (!amount || isNaN(parseFloat(amount))) return null;

    const basePrice = side === 'yes' ? parseFloat(market.yesPrice) : parseFloat(market.noPrice);
    const betAmount = parseFloat(amount);
    const estimatedPrice = basePrice;
    const potentialPayout = betAmount / estimatedPrice;
    const potentialProfit = potentialPayout - betAmount;

    return {
      basePrice,
      estimatedPrice,
      priceImpact: 0,
      potentialPayout,
      potentialProfit,
    };
  };

  const estimate = calculatePriceEstimate();

  const mutation = useMutation({
    mutationFn: async (data: BetFormData) => {
      if (!isConnected) throw new Error('Identity Verification Required');
      if (!isInitialized) throw new Error('Contract not initialized');
      
      const result = await placeBet(
        market.onchainId || market.id,
        data.side.toUpperCase() as 'YES' | 'NO',
        parseFloat(data.amount)
      );

      if (!result) throw new Error('On-chain transaction failed or was cancelled');
      const { txHash, onchainId } = result;

      return await wagersApi.placeBet({
        marketId: market.id,
        amount: data.amount,
        side: data.side,
        slippage: data.slippage,
        txHash,
        onchainId,
      });
    },
    onSuccess: (data, variables) => {
      setSuccessData({
        txHash: data.transaction?.hash || '',
        amount: variables.amount,
        side: variables.side.toUpperCase()
      });
      queryClient.invalidateQueries({ queryKey: ['market', market.id] });
      queryClient.invalidateQueries({ queryKey: ['bets'] });
      reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Trade Execution Failed');
    },
  });

  const onSubmit = async (data: BetFormData) => {
    if (!isConnected) {
      setWalletModalOpen(true);
      return;
    }
    mutation.mutate(data);
  };

  return (
    <div className="glass-card glass-shine bg-slate-900/60 border border-white/10 rounded-sm overflow-hidden flex flex-col h-full backdrop-blur-md">
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
              {...register('amount')}
              type="number"
              step="any"
              placeholder="0.00"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSubmit(onSubmit)();
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

        {/* Advanced Settings & Summary */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[10px] font-mono text-slate-500 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2"
          >
            {showAdvanced ? 'Hide Advanced' : 'Slippage & Summary'}
          </button>

          {showAdvanced && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Slippage */}
              <div className="space-y-3 p-3 bg-black/40 border border-white/5 rounded-sm">
                <div className="flex items-center gap-2">
                  <Percent className="w-3.5 h-3.5 text-slate-600" />
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                    Slippage Tolerance
                  </label>
                </div>
                <Controller
                  name="slippage"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={field.value}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-electric-blue"
                      />
                      <div className="flex justify-between text-[9px] font-mono text-slate-600 uppercase">
                        <span>Low (0.1%)</span>
                        <span className="text-electric-blue font-bold">{field.value}%</span>
                        <span>High (10%)</span>
                      </div>
                    </div>
                  )}
                />
              </div>

              {/* Summary */}
              {estimate && (
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-sm space-y-2">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-500 uppercase">Avg Price</span>
                    <span className="text-white">{(estimate.estimatedPrice * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono pt-2 border-t border-white/[0.05]">
                    <span className="text-slate-500 uppercase">Potential Payout</span>
                    <span className="text-success-green font-bold">{estimate.potentialPayout.toFixed(2)} NIGHT</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit(onSubmit)}
          disabled={mutation.isPending || (isConnected && (!amount || parseFloat(amount) <= 0))}
          className={`w-full py-4 rounded-sm font-bold text-sm tracking-[0.2em] relative group overflow-hidden transition-all ${
            !isConnected
              ? 'bg-electric-blue text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
              : side === 'yes'
                ? 'bg-success-green text-black hover:bg-success-green/90 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                : 'bg-red-500 text-white hover:bg-red-500/90 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
          } disabled:opacity-50 disabled:shadow-none disabled:bg-slate-800 disabled:text-slate-500 flex items-center justify-center gap-2`}
        >
          {mutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin text-current" />
          ) : !isConnected ? (
             <Zap className="w-4 h-4" />
          ) : (
             <Zap className="w-4 h-4" />
          )}
          
          {!isConnected ? (
            'Connect wallet'
          ) : mutation.isPending ? (
            'PROVING...'
          ) : (
            `Create ${side.toUpperCase()} Bet`
          )}

          <div className="absolute inset-0 bg-white opacity-0 group-active:opacity-20 transition-opacity" />
        </button>
      </div>

      <TxSuccessModal 
        isOpen={!!successData}
        onClose={() => setSuccessData(null)}
        txHash={successData?.txHash || ''}
        title="Position Secured"
        subtitle={`Successfully deposited ${successData?.amount} NIGHT into the ZK-escrow pool for the ${successData?.side} outcome.`}
      />
    </div>
  );
}
