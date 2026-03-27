import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TrendingUp, TrendingDown, Info, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { wagersApi } from '../../api/wagers';
import { useWallet } from '../../hooks/useWallet';
import { Market } from '../../types';

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
  const { isConnected, formattedBalance, setWalletModalOpen } = useWallet();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
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
    const liquidityFactor = parseFloat(market.totalLiquidity) || 1000000;
    
    // Simplified AMM formula for demonstration
    const priceImpact = (betAmount / liquidityFactor) * 0.05; 
    const estimatedPrice = basePrice + (side === 'yes' ? priceImpact : -priceImpact);
    
    const potentialPayout = betAmount / estimatedPrice;
    const potentialProfit = potentialPayout - betAmount;
    const returnPercentage = (potentialProfit / betAmount) * 100;

    return {
      estimatedPrice,
      priceImpact: priceImpact * 100,
      potentialPayout,
      potentialProfit,
      returnPercentage,
    };
  }, [amount, side, market]);

  const mutation = useMutation({
    mutationFn: (data: BetFormData) => 
      wagersApi.placeBet({
        marketId: market.id,
        amount: data.amount,
        side: data.side,
        slippage: data.slippage,
      }),
    onSuccess: (data) => {
      toast.success(`Position Secured: ${data.positionId.slice(0, 8)}...`);
      queryClient.invalidateQueries({ queryKey: ['market', market.id] });
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      setValue('amount', '');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Execution Failed');
    },
  });

  const onSubmit = async (data: BetFormData) => {
    if (!isConnected) {
      setWalletModalOpen(true);
      return;
    }
    setIsSubmitting(true);
    try {
      await mutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-sm overflow-hidden flex flex-col h-full backdrop-blur-md">
      <div className="p-1 border-b border-white/10 bg-black/40 flex">
        <button 
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

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Input Amount</label>
            <span className="text-[10px] font-mono text-slate-400">Balance: <span className="text-white">{isConnected ? formattedBalance : '--'}</span> DUST</span>
          </div>
          <div className="relative group">
            <input 
              {...control.register('amount')}
              type="number"
              step="any"
              placeholder="0.00"
              className={`w-full bg-slate-950 border ${errors.amount ? 'border-red-500/50' : 'border-white/10 group-focus-within:border-electric-blue/50'} p-4 rounded-sm font-mono text-2xl text-white focus:outline-none transition-all`}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs font-bold">
              DUST
            </div>
          </div>
          {errors.amount && (
            <p className="text-red-400 text-[10px] font-mono uppercase mt-1">{errors.amount.message}</p>
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
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-500 flex items-center gap-1.5 uppercase tracking-tight">
              Execution Price <Info className="w-3 h-3 text-slate-600" />
            </span>
            <span className="text-white font-bold tracking-tight">
              {estimate ? `${(estimate.estimatedPrice * 100).toFixed(2)}%` : '--'}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-500 flex items-center gap-1.5 uppercase tracking-tight">
              Market Impact <Info className="w-3 h-3 text-slate-600" />
            </span>
            <span className={estimate?.priceImpact && estimate.priceImpact > 3 ? 'text-amber-500 font-bold' : 'text-success-green font-bold'}>
              {estimate ? `${estimate.priceImpact.toFixed(2)}%` : '0.00%'}
            </span>
          </div>

          <div className="bg-slate-950/80 border border-white/5 p-4 rounded-sm space-y-3">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-slate-400">
              Potential Reward
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-mono text-success-green font-bold leading-none">
                {estimate ? `+${estimate.potentialProfit.toFixed(2)}` : '0.00'}
                <span className="text-xs ml-1 font-light opacity-50">DUST</span>
              </div>
              <div className="text-[10px] font-mono bg-success-green/10 text-success-green px-2 py-0.5 rounded-sm border border-success-green/20">
                {estimate ? `+${estimate.returnPercentage.toFixed(1)}%` : '--'}
              </div>
            </div>
          </div>
        </div>

        {estimate?.priceImpact && estimate.priceImpact > 5 && (
          <div className="flex gap-3 bg-amber-500/10 border border-amber-500/20 p-3 rounded-sm items-start">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[10px] text-amber-200/80 font-mono leading-tight uppercase">
              WARNING: High price impact detected. Consider reducing stake size for better execution.
            </p>
          </div>
        )}

        <button 
          type={isConnected ? "submit" : "button"}
          onClick={!isConnected ? () => setWalletModalOpen(true) : undefined}
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
              EXECUTING_TX...
            </span>
          ) : !isConnected ? (
            'Connect Wallet'
          ) : (
            `PLACE_${side.toUpperCase()}_WAGER`
          )}
          
          <div className="absolute inset-0 bg-white opacity-0 group-active:opacity-20 transition-opacity" />
        </button>
      </form>
    </div>
  );
}
