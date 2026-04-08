import { zodResolver } from '@hookform/resolvers/zod';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useContract } from '../../hooks/useContract';
import { useWallet } from '../../hooks/useWallet';
import { Market } from '../../types';
import { PlaceBetModal } from './PlaceBetModal';

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
  useContract();
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleOpenModal = () => {
    if (!isConnected) {
      setWalletModalOpen(true);
      return;
    }
    setIsModalOpen(true);
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
              {...control.register('amount')}
              type="number"
              step="any"
              placeholder="0.00"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOpenModal();
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

        <button
          type="button"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            handleOpenModal();
          }}
          disabled={isConnected && (!amount || parseFloat(amount) <= 0)}
          className={`w-full py-4 rounded-sm font-bold text-sm tracking-[0.2em] relative group overflow-hidden transition-all ${
            !isConnected
              ? 'bg-electric-blue text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
              : side === 'yes'
                ? 'bg-success-green text-black hover:bg-success-green/90 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                : 'bg-red-500 text-white hover:bg-red-500/90 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
          } disabled:opacity-50 disabled:shadow-none disabled:bg-slate-800 disabled:text-slate-500`}
        >
          {!isConnected ? (
            'Connect wallet'
          ) : (
            `Initialize ${side} wager`
          )}

          <div className="absolute inset-0 bg-white opacity-0 group-active:opacity-20 transition-opacity" />
        </button>
      </div>

      <PlaceBetModal 
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        market={market}
      />
    </div>
  );
}
