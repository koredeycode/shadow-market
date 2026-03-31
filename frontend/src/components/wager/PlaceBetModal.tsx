import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Info, TrendingUp, Zap, Loader2, AlertCircle, Percent } from 'lucide-react';
import toast from 'react-hot-toast';
import { wagersApi } from '../../api/wagers';
import { useWallet } from '../../hooks/useWallet';
import { Market } from '../../types';

const betSchema = z.object({
  amount: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Amount must be greater than 0',
  }),
  side: z.enum(['yes', 'no'], {
    required_error: 'Please select YES or NO',
  }),
  slippage: z.number().min(0.1).max(50).default(1),
});

type BetFormData = z.infer<typeof betSchema>;

interface PlaceBetModalProps {
  open: boolean;
  onClose: () => void;
  market: Market;
}

export function PlaceBetModal({ open, onClose, market }: PlaceBetModalProps) {
  const { isConnected, unshieldedNightBalance, formattedUnshieldedNightBalance, connectWallet } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    watch,
    formState: {},
    reset,
    setValue,
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
    const liquidityFactor = parseFloat(market.totalLiquidity) || 1000000;
    const priceImpact = (betAmount / liquidityFactor) * 0.1;

    const estimatedPrice = basePrice + (side === 'yes' ? priceImpact : -priceImpact);
    const potentialPayout = betAmount / estimatedPrice;
    const potentialProfit = potentialPayout - betAmount;

    return {
      basePrice,
      estimatedPrice,
      priceImpact: priceImpact * 100,
      potentialPayout,
      potentialProfit,
    };
  };

  const estimate = calculatePriceEstimate();

  const validateAmount = () => {
    if (!amount) return null;
    const betAmount = parseFloat(amount);
    const minBet = parseFloat(market.minBet);
    const maxBet = parseFloat(market.maxBet);
    const userBalance = parseFloat(unshieldedNightBalance || '0');

    if (betAmount < minBet) return `Minimum bet is ${minBet}`;
    if (betAmount > maxBet) return `Maximum bet is ${maxBet}`;
    if (betAmount > userBalance) return `Insufficient balance. You have ${formattedUnshieldedNightBalance}`;
    return null;
  };

  const amountError = validateAmount();

  const mutation = useMutation({
    mutationFn: async (data: BetFormData) => {
      if (!isConnected) throw new Error('Wallet not connected');
      return await wagersApi.placeBet({
        marketId: market.id,
        amount: data.amount,
        side: data.side,
        slippage: data.slippage,
      });
    },
    onSuccess: data => {
      toast.success(`Trade Executed! Position: ${data.positionId.slice(0, 8)}...`);
      queryClient.invalidateQueries({ queryKey: ['market', market.id] });
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Trade Execution Failed');
    },
  });

  const onSubmit = async (data: BetFormData) => {
    if (amountError) return;
    setIsSubmitting(true);
    try {
      await mutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center w-screen h-screen bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-sm shadow-2xl overflow-hidden animate-in zoom-in duration-300 my-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-black/20">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-electric-blue" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-[0.2em] uppercase">
                Initialize Trade
              </h2>
              <p className="text-[10px] text-slate-500 font-mono tracking-tight uppercase">
                AMM Execution Interface
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors group"
          >
            <X className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
          {/* Market Summary */}
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em] mb-2 block">
              Protocol Target
            </span>
            <p className="text-white font-bold leading-snug">{market.question}</p>
          </div>

          {!isConnected ? (
            <div className="p-6 border border-dashed border-amber-500/30 bg-amber-500/5 rounded-sm text-center space-y-4">
              <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
              <p className="text-sm text-amber-200/80 font-mono uppercase tracking-tight">
                Identity Verification Required
              </p>
              <button
                type="button"
                onClick={connectWallet}
                className="w-full py-3 bg-electric-blue text-white font-bold text-xs uppercase tracking-[0.2em] rounded-sm hover:brightness-110 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Outcome Selection */}
              <div className="space-y-3">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                  Select Outcome
                </label>
                <Controller
                  name="side"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => field.onChange('yes')}
                        className={`py-4 flex flex-col items-center justify-center gap-1 rounded-sm border transition-all ${
                          field.value === 'yes'
                            ? 'bg-success-green/20 text-success-green border-success-green/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                            : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/10'
                        }`}
                      >
                        <span className="text-xs font-bold tracking-widest uppercase">YES</span>
                        <span className="text-[10px] font-mono opacity-60">
                          {(parseFloat(market.yesPrice) * 100).toFixed(1)}%
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange('no')}
                        className={`py-4 flex flex-col items-center justify-center gap-1 rounded-sm border transition-all ${
                          field.value === 'no'
                            ? 'bg-red-500/20 text-red-500 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                            : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/10'
                        }`}
                      >
                        <span className="text-xs font-bold tracking-widest uppercase">NO</span>
                        <span className="text-[10px] font-mono opacity-60">
                          {(parseFloat(market.noPrice) * 100).toFixed(1)}%
                        </span>
                      </button>
                    </div>
                  )}
                />
              </div>

              {/* Trade Size */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                    Trade Size
                  </label>
                  <span className="text-[10px] text-slate-600 font-mono italic font-bold">
                    Avail: {formattedUnshieldedNightBalance}
                  </span>
                </div>
                <div className="relative">
                  <Controller
                    name="amount"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        placeholder="0.00"
                        className={`w-full bg-black/40 border p-4 rounded-sm text-xl font-mono text-white focus:outline-none focus:ring-1 focus:ring-electric-blue/50 transition-all ${
                          amountError
                            ? 'border-red-500/50'
                            : 'border-white/10 focus:border-electric-blue/30'
                        }`}
                      />
                    )}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    <span className="text-xs text-slate-600 font-bold tracking-widest uppercase">
                      NIGHT
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 75, 100].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        const bal = parseFloat(unshieldedNightBalance || '0');
                        setValue('amount', ((bal * pct) / 100).toFixed(2));
                      }}
                      className="py-1.5 bg-white/5 border border-white/5 rounded-sm text-[10px] font-mono text-slate-500 hover:bg-white/10 hover:text-white transition-all uppercase"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
                {amountError && (
                  <p className="text-[10px] text-red-500 font-mono uppercase transition-opacity">
                    {amountError}
                  </p>
                )}
              </div>

              {/* Slippage */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2">
                  <Percent className="w-3.5 h-3.5 text-slate-600" />
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                    Slippage Tolerance
                  </label>
                  <div className="group relative">
                    <Info className="w-3 h-3 text-slate-600 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 border border-white/10 rounded-sm text-[9px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-mono">
                      Maximum price variance accepted during execution. High slippage ensures
                      execution in volatile markets.
                    </div>
                  </div>
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

              {/* Execution Summary */}
              {estimate && (
                <div className="pt-6 border-t border-white/5 space-y-4">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] block">
                    Execution Summary
                  </span>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-500 uppercase">Avg Price</span>
                      <span className="text-white">
                        {(estimate.estimatedPrice * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-500 uppercase">Price Impact</span>
                      <span
                        className={
                          estimate.priceImpact > 3 ? 'text-amber-500' : 'text-success-green'
                        }
                      >
                        {estimate.priceImpact.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] font-mono pt-2 border-t border-white/[0.02]">
                      <span className="text-slate-500 uppercase">Expected Payout</span>
                      <span className="text-white font-bold underline decoration-electric-blue/40">
                        {estimate.potentialPayout.toFixed(2)} NIGHT
                      </span>
                    </div>
                  </div>

                  {estimate.priceImpact > 5 && (
                    <div className="flex gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-sm italic">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      <p className="text-[10px] text-amber-200/80 uppercase tracking-tight">
                        Warning: Significant price impact detected. Large volume may result in
                        unfavorable entry.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-4 bg-white/5 border border-white/5 text-slate-500 font-bold text-[11px] uppercase tracking-[0.2em] rounded-sm hover:bg-white/10 hover:text-white transition-all"
            >
              Abort
            </button>
            <button
              type="submit"
              disabled={!isConnected || isSubmitting || !!amountError || !amount}
              className="flex-[2] py-4 bg-white text-black font-bold text-[11px] uppercase tracking-[0.2em] rounded-sm hover:bg-electric-blue hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              {isSubmitting ? 'EXECUTING...' : 'CONFIRM_TRADE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
