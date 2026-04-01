import { Activity, Trophy, XCircle, ExternalLink, Clock, Zap } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Position, positionsApi } from '../../api/positions';

interface PositionCardProps {
  position: Position;
  isActive: boolean;
  onClaimSuccess: () => void;
}

function PositionRow({ position, isActive: _isActive, onClaimSuccess }: PositionCardProps) {
  const queryClient = useQueryClient();
  const [claiming, setClaiming] = useState(false);

  const claimMutation = useMutation({
    mutationFn: () => positionsApi.claimWinnings(position.id),
    onSuccess: data => {
      toast.success(`Successfully claimed ${formatCurrency(data.amount)}!`);
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      onClaimSuccess();
      setClaiming(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to claim winnings');
      setClaiming(false);
    },
  });

  const handleClaim = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setClaiming(true);
    claimMutation.mutate();
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const calculatePnL = () => {
    if (position.isSettled && position.profitLoss) {
      return parseFloat(position.profitLoss);
    }
    const currentValue = parseFloat(position.amount) * position.currentPrice;
    const entryValue = parseFloat(position.amount) * position.entryPrice;
    return currentValue - entryValue;
  };

  const calculateROI = () => {
    const pnl = calculatePnL();
    const investment = parseFloat(position.amount) * position.entryPrice;
    return (pnl / Math.max(investment, 0.01)) * 100;
  };

  const pnl = calculatePnL();
  const roi = calculateROI();
  const isProfitable = pnl >= 0;

  const formatTimeRemaining = (endTimeStr: string) => {
    const endTime = new Date(endTimeStr).getTime();
    const now = Date.now();
    const diff = endTime - now;
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const canClaim = position.isSettled && position.payout && parseFloat(position.payout) > 0;

  const outcomeWon =
    position.marketStatus === 'resolved' &&
    ((position.side === 'yes' && position.marketOutcome === 1) ||
      (position.side === 'no' && position.marketOutcome === 0));

  return (
    <div className="group border-b border-white/5 hover:bg-white/[0.02] transition-colors">
      <Link to={`/markets/${position.marketSlug || position.marketId}`} className="block">
        {/* Desktop View */}
        <div className="hidden lg:grid grid-cols-12 gap-4 items-center px-6 py-4">
          <div className="col-span-4 space-y-1">
            <h4 className="text-xs font-bold text-white group-hover:text-electric-blue transition-colors truncate">
              {position.marketQuestion}
            </h4>
            <div className="flex items-center gap-2">
              <span
                className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-sm border ${
                  position.side === 'yes'
                    ? 'border-success-green/30 text-success-green bg-success-green/5'
                    : 'border-red-500/30 text-red-500 bg-red-500/5'
                }`}
              >
                {position.side}
              </span>
              <span className="text-[9px] font-mono text-slate-600 uppercase">
                ID: {position.marketId.slice(0, 8)}
              </span>
            </div>
          </div>

          <div className="col-span-2 text-center flex flex-col items-center">
            <span className="text-[9px] font-mono text-slate-500 uppercase mb-1">Status</span>
            {position.marketStatus === 'resolved' ? (
              <div
                className={`flex items-center gap-1.5 text-[10px] font-bold font-mono ${outcomeWon ? 'text-success-green' : 'text-red-500'}`}
              >
                {outcomeWon ? <Trophy className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {outcomeWon ? 'WON' : 'LOST'}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-amber-500">
                <Clock className="w-3 h-3" />
                {formatTimeRemaining(position.marketEndTime)}
              </div>
            )}
          </div>

          <div className="col-span-2 text-right space-y-1">
            <p className="text-[11px] font-mono text-white font-bold">
              {formatCurrency(position.amount)}
            </p>
            <p className="text-[9px] font-mono text-slate-500">
              @{(position.entryPrice * 100).toFixed(1)}%
            </p>
          </div>

          <div className="col-span-2 text-right space-y-1">
            <p
              className={`text-[11px] font-mono font-bold ${isProfitable ? 'text-success-green' : 'text-red-500'}`}
            >
              {(isProfitable ? '+' : '') + formatCurrency(pnl.toString())}
            </p>
            <p
              className={`text-[9px] font-mono ${isProfitable ? 'text-success-green/60' : 'text-red-500/60'}`}
            >
              {(isProfitable ? '+' : '') + roi.toFixed(1)}%
            </p>
          </div>

          <div className="col-span-2 flex justify-end">
            {canClaim ? (
              <button
                onClick={handleClaim}
                disabled={claiming || claimMutation.isPending}
                className="px-4 py-2 bg-success-green text-black text-[10px] font-bold font-mono uppercase tracking-widest rounded-sm hover:bg-success-green/90 transition-all flex items-center gap-2"
              >
                {claiming ? (
                  <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <Zap className="w-3 h-3" />
                )}
                Claim
              </button>
            ) : (
              <div className="p-2 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden p-4 space-y-4">
          <div className="flex justify-between items-start">
            <h4 className="text-xs font-bold text-white pr-4 leading-relaxed">
              {position.marketQuestion}
            </h4>
            <span
              className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-sm shrink-0 ${
                position.side === 'yes'
                  ? 'border border-success-green/30 text-success-green'
                  : 'border border-red-500/30 text-red-500'
              }`}
            >
              {position.side}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/5">
            <div className="space-y-1">
              <span className="text-[8px] font-mono text-slate-500 uppercase">Amount</span>
              <p className="text-[10px] font-mono text-white font-bold">
                {formatCurrency(position.amount)}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[8px] font-mono text-slate-500 uppercase">P/L</span>
              <p
                className={`text-[10px] font-mono font-bold ${isProfitable ? 'text-success-green' : 'text-red-500'}`}
              >
                {roi.toFixed(1)}%
              </p>
            </div>
            <div className="space-y-1 text-right">
              <span className="text-[8px] font-mono text-slate-500 uppercase">Status</span>
              <p className="text-[10px] font-mono text-white font-bold uppercase">
                {position.marketStatus === 'resolved' ? (outcomeWon ? 'WON' : 'LOST') : 'OPEN'}
              </p>
            </div>
          </div>

          {canClaim && (
            <button
              onClick={handleClaim}
              disabled={claiming || claimMutation.isPending}
              className="w-full py-2.5 bg-success-green text-black text-[10px] font-bold font-mono uppercase tracking-widest rounded-sm hover:bg-success-green/90 transition-all flex items-center justify-center gap-2"
            >
              Claim {formatCurrency(position.payout!)}
            </button>
          )}
        </div>
      </Link>
    </div>
  );
}

interface PositionsListProps {
  positions: Position[];
  isActive: boolean;
  onClaimSuccess: () => void;
}

export function PositionsList({ positions, isActive, onClaimSuccess }: PositionsListProps) {
  if (positions.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-full text-slate-600">
          <Activity className="w-8 h-8 opacity-20" />
        </div>
        <div className="space-y-1">
          <h4 className="text-white font-bold text-xs uppercase tracking-widest">
            {isActive ? 'Zero Active Units' : 'History Empty'}
          </h4>
          <p className="text-slate-500 text-[10px] font-mono max-w-[200px] leading-relaxed">
            {isActive
              ? 'Initiate on-chain wagers to begin tracking positions.'
              : 'Resolved wagers will be archived here upon market settlement.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[400px]">
      <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 text-[9px] font-mono text-slate-500 uppercase tracking-widest bg-white/[0.01]">
        <div className="col-span-4">Market_Asset</div>
        <div className="col-span-2 text-center">Outcome</div>
        <div className="col-span-2 text-right">Position_Size</div>
        <div className="col-span-2 text-right">Performance</div>
        <div className="col-span-2 text-right">Execution</div>
      </div>
      <div>
        {positions.map(position => (
          <PositionRow
            key={position.id}
            position={position}
            isActive={isActive}
            onClaimSuccess={onClaimSuccess}
          />
        ))}
      </div>
    </div>
  );
}
