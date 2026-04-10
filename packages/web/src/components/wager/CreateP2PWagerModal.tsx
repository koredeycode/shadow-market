import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Info, Clock, TrendingUp, TrendingDown, Zap, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { wagersApi } from '../../api/wagers';
import { useWallet } from '../../hooks/useWallet';
import { useContract } from '../../hooks/useContract';
import { Market } from '../../types';
import { TxSuccessModal } from '../common/TxSuccessModal';

const p2pWagerSchema = z.object({
  amount: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Amount must be greater than 0',
  }),
  side: z.enum(['yes', 'no'], {
    required_error: 'Please select YES or NO',
  }),
  oddsNumerator: z.number().min(1).max(100),
  oddsDenominator: z.number().min(1).max(100),
  durationHours: z.number().min(1).max(168), // Max 1 week
});

type P2PWagerFormData = z.infer<typeof p2pWagerSchema>;

interface CreateP2PWagerModalProps {
  open: boolean;
  onClose: () => void;
  market: Market;
}

export function CreateP2PWagerModal({ open, onClose, market }: CreateP2PWagerModalProps) {
  const { isConnected, unshieldedNightBalance, formattedUnshieldedNightBalance, setWalletModalOpen } = useWallet();
  const { createWager } = useContract();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ txHash: string; amount: string; side: string } | null>(null);
  const queryClient = useQueryClient();

  const { control, handleSubmit, watch, reset } = useForm<P2PWagerFormData>({
    resolver: zodResolver(p2pWagerSchema),
    defaultValues: {
      amount: '',
      side: 'yes',
      oddsNumerator: 3,
      oddsDenominator: 1,
      durationHours: 24,
    },
  });

  const amount = watch('amount');
  const oddsNumerator = watch('oddsNumerator');
  const oddsDenominator = watch('oddsDenominator');

  const calculatePayoutInfo = () => {
    if (!amount || isNaN(parseFloat(amount))) return null;

    const betAmount = parseFloat(amount);
    const odds = oddsNumerator / oddsDenominator;
    const yourPotentialWin = betAmount * odds;
    const opponentStake = yourPotentialWin;
    const opponentPotentialWin = betAmount;
    const totalPool = betAmount + opponentStake;

    return {
      yourStake: betAmount,
      yourPotentialWin,
      opponentStake,
      opponentPotentialWin,
      totalPool,
      oddsDisplay: `${oddsNumerator}:${oddsDenominator}`,
      impliedProbability: (oddsDenominator / (oddsNumerator + oddsDenominator)) * 100,
    };
  };

  const payoutInfo = calculatePayoutInfo();

  const validateAmount = () => {
    if (!amount) return null;
    const betAmount = parseFloat(amount);
    const minBet = 1; // Atomic unit minimum
    const maxBet = 1000000000; // Unlimited
    const userBalance = parseFloat(unshieldedNightBalance || '0') / 1_000_000;

    if (betAmount < minBet) return `Minimum bet is ${minBet}`;
    if (betAmount > maxBet) return `Maximum bet is ${maxBet}`;
    if (betAmount > userBalance) return `Insufficient balance. You have ${formattedUnshieldedNightBalance}`;
    return null;
  };

  const amountError = validateAmount();

  const mutation = useMutation({
    mutationFn: async (data: P2PWagerFormData) => {
      if (!isConnected) throw new Error('Identity Verification Required');
      
      // Step 1: REQUIRED - Execute on-chain contract call
      console.log('DEBUG: Initiating on-chain P2P wager creation...');
      const result = await createWager(
        market.onchainId || market.id,
        data.side.toUpperCase() as 'YES' | 'NO',
        parseFloat(data.amount),
        [data.oddsNumerator, data.oddsDenominator]
      );

      if (!result) throw new Error('On-chain wager creation failed or was cancelled');
      const { txHash, onchainId } = result;

      // Step 2: Sync to backend for indexing
      console.log('DEBUG: Syncing P2P wager to backend with txHash:', txHash, 'onchainId:', onchainId);
      return await wagersApi.createP2PWager({
        marketId: market.id,
        amount: data.amount,
        side: data.side,
        odds: [data.oddsNumerator, data.oddsDenominator],
        duration: data.durationHours * 3600,
        txHash,
        onchainId,
      });
    },
    onSuccess: (data, variables) => {
      setSuccessData({
        txHash: data.txHash || '',
        amount: variables.amount,
        side: variables.side.toUpperCase()
      });
      queryClient.invalidateQueries({ queryKey: ['market', market.id] });
      queryClient.invalidateQueries({ queryKey: ['p2p-wagers', market.id] });
      reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create wager');
    },
  });

  const onSubmit = async (data: P2PWagerFormData) => {
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
        className="relative w-full max-w-xl bg-slate-900 border border-white/10 rounded-sm shadow-2xl overflow-hidden animate-in zoom-in duration-300 my-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-black/20">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-electric-blue" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-[0.2em] uppercase">
                Create P2P Protocol
              </h2>
              <p className="text-[10px] text-slate-500 font-mono tracking-tight uppercase">
                Peer-to-Peer Betting Interface
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
          {/* Market Info */}
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em] mb-2 block">
              Active Market
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
                onClick={() => setWalletModalOpen(true)}
                className="w-full py-3 bg-electric-blue text-white font-bold text-xs uppercase tracking-[0.2em] rounded-sm hover:brightness-110 transition-all"
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* P2P Tip */}
              <div className="flex gap-3 p-3 bg-electric-blue/5 border border-electric-blue/20 rounded-sm italic">
                <Info className="w-4 h-4 text-electric-blue shrink-0" />
                <p className="text-[11px] text-slate-400">
                  You are creating a direct-match contract. Another user must accept these terms to
                  initialize the wager. Zero house fees apply.
                </p>
              </div>

              {/* Side Selection */}
              <div className="space-y-3">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                  Select Position
                </label>
                <Controller
                  name="side"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => field.onChange('yes')}
                        className={`py-3 flex items-center justify-center gap-2 rounded-sm font-bold text-xs tracking-widest border transition-all ${
                          field.value === 'yes'
                            ? 'bg-success-green/20 text-success-green border-success-green/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                            : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/10'
                        }`}
                      >
                        <TrendingUp className="w-4 h-4" /> YES
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange('no')}
                        className={`py-3 flex items-center justify-center gap-2 rounded-sm font-bold text-xs tracking-widest border transition-all ${
                          field.value === 'no'
                            ? 'bg-red-500/20 text-red-500 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                            : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/10'
                        }`}
                      >
                        <TrendingDown className="w-4 h-4" /> NO
                      </button>
                    </div>
                  )}
                />
              </div>

              {/* Amount Input */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                    Stake Amount
                  </label>
                  <span className="text-[10px] text-slate-600 font-mono italic font-bold">
                    Balance: {formattedUnshieldedNightBalance}
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
                {amountError && (
                  <p className="text-[10px] text-red-500 font-mono uppercase translate-y-1">
                    {amountError}
                  </p>
                )}
              </div>

              {/* Custom Odds */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                    Defined Odds
                  </label>
                  <div className="group relative">
                    <Info className="w-3 h-3 text-slate-600 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 border border-white/10 rounded-sm text-[9px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-mono">
                      Example: 3:1 means you win 3x your stake. Use high multiples for improbable
                      outcomes.
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <Controller
                      name="oddsNumerator"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          className="w-full bg-black/20 border border-white/5 p-3 rounded-sm text-center font-mono text-electric-blue font-bold focus:outline-none focus:border-electric-blue/30"
                          onChange={e => field.onChange(parseFloat(e.target.value) || 1)}
                        />
                      )}
                    />
                    <p className="text-[8px] text-slate-600 font-bold text-center uppercase tracking-widest">
                      Multiplier
                    </p>
                  </div>
                  <span className="text-xl text-slate-700 font-mono">:</span>
                  <div className="flex-1 space-y-1">
                    <Controller
                      name="oddsDenominator"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          className="w-full bg-black/20 border border-white/5 p-3 rounded-sm text-center font-mono text-white font-bold focus:outline-none focus:border-white/20"
                          onChange={e => field.onChange(parseFloat(e.target.value) || 1)}
                        />
                      )}
                    />
                    <p className="text-[8px] text-slate-600 font-bold text-center uppercase tracking-widest">
                      Base
                    </p>
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-600" />
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                    Protocol Expiration (Hours)
                  </label>
                </div>
                <Controller
                  name="durationHours"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      className="w-full bg-black/20 border border-white/5 p-3 rounded-sm text-sm font-mono text-slate-400 focus:outline-none focus:border-white/20"
                      onChange={e => field.onChange(parseInt(e.target.value) || 24)}
                    />
                  )}
                />
              </div>

              {/* Payout Table */}
              {payoutInfo && (
                <div className="pt-6 border-t border-white/5 space-y-3">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-2 block">
                    Projected Settlement
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[9px] text-slate-600 uppercase font-mono">
                       Your Potential Payout
                    </p>
                    <p className="text-lg font-mono text-success-green font-bold">
                      +{payoutInfo.yourPotentialWin.toFixed(2)} NIGHT
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[9px] text-slate-600 uppercase font-mono">
                      Opponent Requirement
                    </p>
                    <p className="text-lg font-mono text-white font-bold">
                      {payoutInfo.opponentStake.toFixed(2)} NIGHT
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-white/[0.03] rounded-sm text-[10px] font-mono tracking-tight uppercase">
                  <span className="text-slate-500">Total Protocol Value</span>
                  <span className="text-slate-300 font-bold underline decoration-electric-blue/40">
                    {payoutInfo.totalPool.toFixed(2)} NIGHT
                  </span>
                </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-4 bg-white/5 border border-white/5 text-slate-500 font-bold text-[11px] uppercase tracking-[0.2em] rounded-sm hover:bg-white/10 hover:text-white transition-all transition-colors"
            >
              Terminate
            </button>
            <button
              type="submit"
              disabled={!isConnected || isSubmitting || !!amountError || !amount}
              className="flex-[2] py-4 bg-electric-blue text-white font-bold text-[11px] uppercase tracking-[0.2em] rounded-sm hover:brightness-110 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50 disabled:bg-slate-800 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              {isSubmitting ? 'INITIALIZING...' : 'BROADCAST_WAGER'}
            </button>
          </div>
        </form>
      </div>
      <TxSuccessModal 
        isOpen={!!successData}
        onClose={() => {
          setSuccessData(null);
          onClose(); // Close the creation modal too
        }}
        txHash={successData?.txHash || ''}
        title="Protocol Active"
        subtitle={`Successfully published your ${successData?.amount} NIGHT ${successData?.side} wager offer to the decentralized P2P matcher.`}
        primaryAction={{
          label: 'View Orderbook',
          onClick: () => {
             setSuccessData(null);
             onClose();
          }
        }}
      />
    </div>
  );
}
