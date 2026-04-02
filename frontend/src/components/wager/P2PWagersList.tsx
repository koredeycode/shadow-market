import { useQuery } from '@tanstack/react-query';
import {
  User,
  Zap,
  Loader2,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useWallet } from '../../hooks/useWallet';
import { Wager } from '../../types';

interface P2PWagersListProps {
  marketId: string;
  selectedWagerId?: string;
  onSelectWager: (wager: Wager) => void;
}

function WagerCard({
  wager,
  isSelected,
  onSelect,
  isUserCreator,
}: {
  wager: Wager;
  isSelected: boolean;
  onSelect: () => void;
  isUserCreator: boolean;
}) {

  const [oddsNum, oddsDenom] = wager.odds;
  const betAmount = parseFloat(wager.amount);
  const potentialWin = betAmount * (oddsNum / oddsDenom);
  const opponentStake = potentialWin;

  const timeRemaining = () => {
    const now = Date.now();
    const expires = new Date(wager.expiresAt).getTime();
    const diff = expires - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div
      onClick={onSelect}
      className={`p-4 bg-slate-900/40 border rounded-sm transition-all backdrop-blur-sm cursor-pointer ${
        isSelected
          ? 'border-electric-blue bg-electric-blue/5 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-electric-blue/30'
          : isUserCreator
          ? 'border-white/5 hover:border-white/20'
          : 'border-white/10 hover:border-electric-blue/30'
      }`}
    >
      <div className="flex flex-col md:flex-row gap-6 md:items-center">
        {/* Creator Side */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            {wager.creatorSide === 'yes' ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-success-green/10 text-success-green border border-success-green/20 rounded-sm text-[10px] font-bold uppercase tracking-widest">
                <TrendingUp className="w-3 h-3" /> YES
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-sm text-[10px] font-bold uppercase tracking-widest">
                <TrendingDown className="w-3 h-3" /> NO
              </span>
            )}
            {isUserCreator && (
              <span className="px-2 py-0.5 border border-white/10 rounded-sm text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                Your Wager
              </span>
            )}
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
              Creator Stake
            </p>
            <p className="text-xl font-mono text-white font-bold">
              {betAmount.toFixed(2)}{' '}
              <span className="text-xs text-slate-500 font-normal">NIGHT</span>
            </p>
            <p className="text-[10px] text-success-green font-mono uppercase tracking-tight mt-1">
              Wins {potentialWin.toFixed(2)} NIGHT
            </p>
          </div>
        </div>

        {/* Odds Indicator */}
        <div className="flex flex-col items-center justify-center px-4 py-2 bg-white/5 border border-white/5 rounded-sm min-w-[100px]">
          <span className="text-2xl font-mono text-electric-blue font-bold tracking-tighter">
            {oddsNum}:{oddsDenom}
          </span>
          <span className="text-[9px] text-slate-600 uppercase font-bold tracking-[0.2em] mt-1">
            Market Odds
          </span>
        </div>

        {/* Opponent Side */}
        <div className="flex-1 space-y-3 md:text-right">
          <div className="flex items-center gap-2 md:justify-end">
            {wager.creatorSide === 'yes' ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-sm text-[10px] font-bold uppercase tracking-widest">
                NO <TrendingDown className="w-3 h-3" />
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-success-green/10 text-success-green border border-success-green/20 rounded-sm text-[10px] font-bold uppercase tracking-widest">
                YES <TrendingUp className="w-3 h-3" />
              </span>
            )}
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
              Opponent Stake Needed
            </p>
            <p className="text-xl font-mono text-white font-bold">
              {opponentStake.toFixed(2)}{' '}
              <span className="text-xs text-slate-500 font-normal">NIGHT</span>
            </p>
            <p className="text-[10px] text-success-green font-mono uppercase tracking-tight mt-1 md:justify-end">
              Wins {betAmount.toFixed(2)} NIGHT
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-[11px] font-mono text-slate-500">
              {wager.creator?.username || `${wager.creatorId.slice(0, 8)}...`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-[11px] font-mono text-slate-500 lowercase tracking-tight">
              {timeRemaining()}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
           <Zap className={`w-4 h-4 ${isSelected ? 'text-electric-blue animate-pulse' : 'text-slate-700'}`} />
        </div>
      </div>
    </div>
  );
}

export function P2PWagersList({ marketId, selectedWagerId, onSelectWager }: P2PWagersListProps) {
  const { address } = useWallet();

  const {
    data: wagers,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['p2p-wagers', marketId],
    queryFn: async () => {
      // In real implementation, this would call an API endpoint
      return [] as Wager[];
    },
    refetchInterval: 10000,
  });

  // Logic removed here as it lives in P2PActionTerminal now

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-electric-blue animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-sm flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <span className="text-xs font-mono text-red-400 uppercase">
          System Error: Failed to load P2P terminal data.
        </span>
      </div>
    );
  }

  if (!wagers || wagers.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white/2 rounded-sm border border-dashed border-white/5">
        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-2 font-mono">
          No Active P2P Protocols
        </p>
        <p className="text-[11px] text-slate-600 font-mono uppercase">
          Initiate the first peer-to-peer wager for this market.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Active Channels
        </span>
        <span className="text-[10px] font-mono text-electric-blue font-bold px-2 py-0.5 bg-electric-blue/10 rounded-sm">
          {wagers.length} PROTOCOLS_OPEN
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {wagers.map(wager => {
          const isUserCreator = address === wager.creatorId;
          const isSelected = selectedWagerId === wager.id;
          return (
            <WagerCard
              key={wager.id}
              wager={wager}
              isSelected={isSelected}
              onSelect={() => onSelectWager(wager)}
              isUserCreator={isUserCreator}
            />
          );
        })}
      </div>
    </div>
  );
}
