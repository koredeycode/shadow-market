import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Clock, Info, TrendingDown, TrendingUp, Zap, Loader2, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { wagersApi } from '../../api/wagers';
import { useContract } from '../../hooks/useContract';
import { useWallet } from '../../hooks/useWallet';
import { Market, Wager } from '../../types';
import { CustomSelect } from '../common/CustomSelect';
import { DollarSign, Terminal } from 'lucide-react';
import { TxSuccessModal } from '../common/TxSuccessModal';

const p2pWagerSchema = z.object({
  amount: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Amount must be greater than 0',
  }),
  side: z.enum(['yes', 'no']),
  oddsNumerator: z.number().min(1).max(100),
  oddsDenominator: z.number().min(1).max(100),
  durationHours: z.number().min(1).max(168),
});

type P2PWagerFormData = z.infer<typeof p2pWagerSchema>;

interface P2PActionTerminalProps {
  market: Market;
  onClose?: () => void;
  selectedWager?: Wager | null;
  onClearSelection?: () => void;
}

export function P2PActionTerminal({ market, onClose, selectedWager, onClearSelection }: P2PActionTerminalProps) {
  const { isConnected, formattedUnshieldedNightBalance, unshieldedNightBalance, address, setWalletModalOpen } = useWallet();
  const { createWager, acceptWager, cancelWager, claimWagerWinnings, isInitialized } = useContract();
  const queryClient = useQueryClient();
  const [successData, setSuccessData] = useState<{ txHash: string; title: string; subtitle: string } | null>(null);

  const isUserCreator = selectedWager && address === selectedWager.creatorId;

  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm<P2PWagerFormData>({
    resolver: zodResolver(p2pWagerSchema),
    defaultValues: {
      amount: '',
      side: 'yes',
      oddsNumerator: 1,
      oddsDenominator: 1,
      durationHours: 24,
    },
  });

  const amount = watch('amount');
  const side = watch('side');
  const oddsNumerator = watch('oddsNumerator');
  const oddsDenominator = watch('oddsDenominator');

  const payoutInfo = useMemo(() => {
    if (!amount || isNaN(parseFloat(amount))) return null;
    const betAmount = parseFloat(amount);
    const odds = oddsNumerator / oddsDenominator;
    const yourPotentialWin = betAmount * odds;
    const opponentStake = yourPotentialWin;
    const totalPool = betAmount + opponentStake;

    return {
      yourStake: betAmount,
      yourPotentialWin,
      opponentStake,
      totalPool,
      oddsDisplay: `${oddsNumerator}:${oddsDenominator}`,
      impliedProbability: (oddsDenominator / (oddsNumerator + oddsDenominator)) * 100,
    };
  }, [amount, oddsNumerator, oddsDenominator]);

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!selectedWager || !isConnected || !isInitialized) throw new Error('Ready state failure');
      const txHash = await acceptWager(selectedWager.id);
      if (!txHash) throw new Error('Transaction failed');
      await wagersApi.acceptWager(selectedWager.id, { txHash, wagerId: selectedWager.id });
      return txHash;
    },
    onSuccess: (txHash) => {
      setSuccessData({
        txHash,
        title: 'Position Matched',
        subtitle: 'Successfully accepted the P2P wager terms and locked funds in the ZK-escrow.'
      });
      queryClient.invalidateQueries({ queryKey: ['market', market.id] });
      queryClient.invalidateQueries({ queryKey: ['p2p-wagers', market.id] });
      if (onClearSelection) onClearSelection();
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!selectedWager || !isConnected || !isInitialized) throw new Error('Ready state failure');
      const txHash = await cancelWager(selectedWager.id);
      if (!txHash) throw new Error('Transaction failed or was cancelled');
      await wagersApi.cancelWager(selectedWager.id);
      return txHash;
    },
    onSuccess: (txHash) => {
      setSuccessData({
        txHash,
        title: 'Protocol Terminated',
        subtitle: 'Wager offer has been successfully withdrawn from the decentralized matcher.'
      });
      queryClient.invalidateQueries({ queryKey: ['p2p-wagers', market.id] });
      if (onClearSelection) onClearSelection();
    }
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      if (!selectedWager || !isConnected || !isInitialized) throw new Error('Ready state failure');
      const txHash = await claimWagerWinnings(selectedWager.id);
      if (!txHash) throw new Error('Transaction failed or was cancelled');
      return txHash;
    },
    onSuccess: (txHash) => {
      setSuccessData({
        txHash,
        title: 'Winnings Dispersed',
        subtitle: 'Protocol payout has been successfully transferred to your shielded balance.'
      });
      queryClient.invalidateQueries({ queryKey: ['p2p-wagers', market.id] });
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: P2PWagerFormData) => {
      if (!isConnected || !isInitialized) throw new Error('Identity Verification Required');
      
      console.log('DEBUG: Initiating on-chain P2P wager creation...');
      const txHash = await createWager(
        market.onchainId || market.id,
        data.side.toUpperCase() as 'YES' | 'NO',
        parseFloat(data.amount),
        [data.oddsNumerator, data.oddsDenominator]
      );

      if (!txHash) throw new Error('On-chain transaction failed or was cancelled');

      console.log('DEBUG: Syncing to backend...');
      await wagersApi.createP2PWager({
        marketId: market.id,
        amount: data.amount,
        side: data.side,
        odds: [data.oddsNumerator, data.oddsDenominator],
        duration: data.durationHours * 3600,
        txHash,
      });

      return txHash;
    },
    onSuccess: (txHash, variables) => {
      setSuccessData({
        txHash,
        title: 'Protocol Broadcast',
        subtitle: `Successfully published your ${variables.amount} NIGHT ${variables.side.toUpperCase()} wager offer.`
      });
      queryClient.invalidateQueries({ queryKey: ['market', market.id] });
      queryClient.invalidateQueries({ queryKey: ['p2p-wagers', market.id] });
      reset();
    }
  });

  const onSubmit = (data: P2PWagerFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-sm overflow-hidden flex flex-col h-full backdrop-blur-md shadow-2xl">
      <div className="p-1 border-b border-white/10 bg-black/40 flex items-center justify-between">
        <div className="flex flex-1">
          <button
            type="button"
            className="flex-1 py-4 text-electric-blue border-b-2 border-electric-blue bg-electric-blue/5 flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            <span className="font-bold text-xs tracking-widest uppercase">
                {selectedWager 
                    ? isUserCreator ? 'PROTOCOL_MANAGEMENT' : 'PROTOCOL_ACCEPTANCE'
                    : 'P2P_PROTOCOL_CREATE'
                }
            </span>
          </button>
        </div>
        {selectedWager && (
          <button onClick={onClearSelection} className="p-4 hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 overflow-y-auto">
        {selectedWager ? (
            <div className="space-y-6">
                {/* Selected Wager Summary */}
                <div className="p-4 bg-white/[0.03] border border-white/5 rounded-sm space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 uppercase font-mono">Creator Mode</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                            selectedWager.creatorSide === 'yes' ? 'bg-success-green/10 text-success-green' : 'bg-red-500/10 text-red-500'
                        }`}>
                            {selectedWager.creatorSide.toUpperCase()}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 uppercase font-mono">Stake Amount</span>
                        <span className="text-white font-mono font-bold tracking-tight">{selectedWager.amount} NIGHT</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 uppercase font-mono">Payout Odds</span>
                        <span className="text-electric-blue font-mono font-bold">{selectedWager.odds[0]}:{selectedWager.odds[1]}</span>
                    </div>
                </div>

                <div className="pt-2 space-y-4">
                    {isUserCreator ? (
                        <button
                            type="button"
                            onClick={() => cancelMutation.mutate()}
                            disabled={cancelMutation.isPending}
                            className="w-full py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-sm font-bold text-[11px] tracking-[0.2em] uppercase hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                            {cancelMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                            TERMINATE_PROTOCOL
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => acceptMutation.mutate()}
                            disabled={acceptMutation.isPending}
                            className="w-full py-4 bg-success-green text-black rounded-sm font-bold text-[11px] tracking-[0.2em] uppercase hover:brightness-110 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
                        >
                            {acceptMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                            ACCEPT_OFFER_MATCH
                        </button>
                    )}
                    
                    {selectedWager.status === 'RESOLVED' && (
                        <button
                            type="button"
                            onClick={() => claimMutation.mutate()}
                            disabled={claimMutation.isPending}
                            className="w-full py-4 bg-amber-500 text-black rounded-sm font-bold text-[11px] tracking-[0.2em] uppercase hover:brightness-110 transition-all flex items-center justify-center gap-2"
                        >
                             {claimMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                             CLAIM_PROTOCOL_WINNINGS
                        </button>
                    )}
                </div>
            </div>
        ) : (
            <>
                {/* Position Selection */}
        <CustomSelect
          label="Select Position"
          value={side}
          onChange={(val) => reset({ ...watch(), side: val as 'yes' | 'no' })}
          options={[
            { label: 'YES (SUPPORT)', value: 'yes', description: 'Wager that this outcome will occur' },
            { label: 'NO (OPPOSE)', value: 'no', description: 'Wager that this outcome will NOT occur' },
          ]}
        />

        {/* Stake Amount */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-1 h-1 bg-electric-blue rounded-full" />
              Stake Amount
            </label>
            <span className="text-[9px] text-slate-600 font-mono italic">
              Available: {formattedUnshieldedNightBalance}
            </span>
          </div>
          <div className="relative group">
            <input
              {...control.register('amount')}
              type="number"
              placeholder="0.00"
              className={`w-full bg-slate-950 border ${errors.amount ? 'border-red-500/50' : 'border-white/10 group-focus-within:border-electric-blue/50'} p-4 rounded-sm font-mono text-2xl text-white focus:outline-none transition-all`}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 font-mono text-xs font-bold">
              NIGHT
            </div>
          </div>
        </div>

        {/* Binary Odds Selection */}
        <div className="space-y-4">
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
            <div className="w-1 h-1 bg-electric-blue rounded-full" />
            Payout Odds Ratio
          </label>
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-1">
              <Controller
                name="oddsNumerator"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-sm text-center font-mono text-electric-blue font-bold focus:outline-none focus:border-electric-blue/50"
                    onChange={e => field.onChange(parseFloat(e.target.value) || 1)}
                  />
                )}
              />
              <p className="text-[8px] text-slate-700 font-bold text-center uppercase tracking-widest">Multiplier</p>
            </div>
            <span className="text-xl text-white/20 font-mono">:</span>
            <div className="flex-1 space-y-1">
              <Controller
                name="oddsDenominator"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-sm text-center font-mono text-white font-bold focus:outline-none focus:border-white/20"
                    onChange={e => field.onChange(parseFloat(e.target.value) || 1)}
                  />
                )}
              />
              <p className="text-[8px] text-slate-700 font-bold text-center uppercase tracking-widest">Base</p>
            </div>
          </div>
        </div>

        {/* Settlement Info */}
        {payoutInfo && (
          <div className="pt-6 border-t border-white/5 space-y-4">
          <div className="bg-slate-950/80 border border-white/5 p-4 rounded-sm space-y-3">
            <div className="flex justify-between items-center text-[11px] font-mono">
              <span className="text-slate-500 uppercase">Your Potential Payout</span>
              <span className="text-success-green font-bold">+{payoutInfo.yourPotentialWin.toFixed(2)} NIGHT</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-mono">
              <span className="text-slate-500 uppercase">Opponent Stake Required</span>
              <span className="text-white">{payoutInfo.opponentStake.toFixed(2)} NIGHT</span>
            </div>
            <div className="pt-3 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-slate-400">
              <span className="uppercase tracking-widest">Total Liquidity Locked</span>
              <span className="text-electric-blue font-bold">{payoutInfo.totalPool.toFixed(2)} NIGHT</span>
            </div>
          </div>

            <div className="flex gap-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-sm">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[9px] text-amber-200/60 font-mono leading-tight uppercase">
                    Protocol Note: P2P wagers are peer-matched. Funds are locked in the ZK-escrow until market resolution by the designated oracle.
                </p>
            </div>
          </div>
        )}

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={createMutation.isPending || !amount}
                        className="w-full py-4 bg-electric-blue text-white rounded-sm font-bold text-[11px] tracking-[0.2em] uppercase hover:brightness-110 disabled:opacity-50 transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2"
                    >
                        {createMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Zap className="w-4 h-4" />
                        )}
                        {createMutation.isPending ? 'TRANSMITTING_PROOF...' : 'BROADCAST_P2P_PROTOCOL'}
                    </button>
                </div>
            </>
        )}
      </form>
      <TxSuccessModal 
        isOpen={!!successData}
        onClose={() => {
          setSuccessData(null);
          if (onClearSelection) onClearSelection();
        }}
        txHash={successData?.txHash || ''}
        title={successData?.title || 'Success'}
        subtitle={successData?.subtitle || ''}
        primaryAction={{
          label: 'Acknowledge',
          onClick: () => {
             setSuccessData(null);
             if (onClearSelection) onClearSelection();
          }
        }}
      />
    </div>
  );
}
