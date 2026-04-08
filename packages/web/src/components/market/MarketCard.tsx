import { Link } from 'react-router-dom';
import { Clock, BarChart3, ChevronRight, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Market } from '../../types';

interface MarketCardProps {
  market: Market;
}

export function MarketCard({ market }: MarketCardProps) {
  const yesPercent = parseFloat(market.yesPrice) * 100;
  const volume = formatVolume(market.totalVolume);
  const timeLeft = formatDistanceToNow(new Date(market.endTime), { addSuffix: true });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-success-green/10 text-success-green border-success-green/20';
      case 'RESOLVED':
        return 'bg-slate-500/10 text-slate-400 border-white/10';
      default:
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    }
  };

  return (
    <div className="glass-card glass-shine group relative bg-slate-900/40 border border-white/5 rounded-sm overflow-hidden hover:border-electric-blue/30 transition-all duration-500 hover:-translate-y-1 flex flex-col h-full">
      
      <div className="p-5 flex-1 flex flex-col">
        {/* Category & Status */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <span className="px-2 py-0.5 bg-electric-blue/10 text-electric-blue border border-electric-blue/20 rounded-sm text-[9px] font-mono font-bold uppercase tracking-widest">
              {market.category}
            </span>
            <span
              className={`px-2 py-0.5 border rounded-sm text-[9px] font-mono font-bold uppercase tracking-widest ${getStatusColor(market.status)}`}
            >
              {market.status}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.03] border border-white/5 rounded-sm">
             <Heart className="w-3 h-3 text-slate-500" />
             <span className="text-[10px] font-mono text-slate-400 font-bold">{market.upvotes || 0}</span>
          </div>
        </div>

        {/* Question */}
        <Link to={`/markets/${market.slug || market.id}`}>
          <h3 className="text-xl font-bold text-white leading-tight mb-6 line-clamp-2 min-h-[3.5rem] group-hover:text-electric-blue transition-colors duration-300">
            {market.question}
          </h3>
        </Link>

        {/* Sentiment Analysis */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-[10px] font-mono font-bold uppercase tracking-widest">
            <span className="text-success-green">{yesPercent.toFixed(0)}% Likely</span>
            <span className="text-slate-500">Vol: {volume}</span>
          </div>

          <div className="relative h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-success-green transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
              style={{ width: `${yesPercent}%` }}
            />
          </div>
        </div>

        {/* Dynamic Footer Metrics */}
        <div className="mt-auto grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-slate-500">
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="text-[9px] font-mono font-bold uppercase tracking-tighter">
              {market.totalBets.toLocaleString()} Positions
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 justify-end">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[9px] font-mono font-bold uppercase tracking-tighter italic whitespace-nowrap">
              {timeLeft}
            </span>
          </div>
        </div>
      </div>

      <Link
        to={`/markets/${market.slug || market.id}`}
        className="block p-4 bg-white/[0.02] border-t border-white/5 hover:bg-electric-blue/10 transition-colors group/btn"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold font-mono text-slate-400 group-hover/btn:text-white uppercase tracking-[0.2em]">
            View Market
          </span>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover/btn:text-white group-hover/btn:translate-x-1 transition-all" />
        </div>
      </Link>
    </div>
  );
}

function formatVolume(volume: string): string {
  const num = parseFloat(volume);
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M NIGHT`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K NIGHT`;
  }
  return `${num.toFixed(0)} NIGHT`;
}
