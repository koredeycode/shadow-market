import { Link } from 'react-router-dom';
import { Clock, BarChart3, TrendingUp, TrendingDown, ChevronRight, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Market } from '../../types';

interface MarketCardProps {
  market: Market;
}

export function MarketCard({ market }: MarketCardProps) {
  const yesPercent = parseFloat(market.yesPrice) * 100;
  const noPercent = parseFloat(market.noPrice) * 100;
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
    <div className="group relative bg-slate-900/40 border border-white/10 rounded-sm overflow-hidden transition-all duration-300 hover:border-electric-blue/30 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] hover:-translate-y-1 flex flex-col h-full backdrop-blur-sm">
      {/* Gloss Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className="p-5 flex-1 flex flex-col">
        {/* Category & Status */}
        <div className="flex justify-between items-center mb-4">
          <span className="px-2 py-0.5 bg-electric-blue/10 text-electric-blue border border-electric-blue/20 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em]">
            {market.category}
          </span>
          <span
            className={`px-2 py-0.5 border rounded-sm text-[10px] font-bold uppercase tracking-widest ${getStatusColor(market.status)}`}
          >
            {market.status}
          </span>
          <button
            className={`flex items-center gap-1 px-2 py-0.5 border rounded-sm text-[10px] font-bold transition-all ${
              market.hasUpvoted
                ? 'bg-red-500/10 border-red-500/30 text-red-500'
                : 'bg-white/5 border-white/10 text-slate-500 hover:border-red-500/30 hover:text-red-500'
            }`}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              // Mutation logic would be here
            }}
          >
            <Heart className={`w-3 h-3 ${market.hasUpvoted ? 'fill-current' : ''}`} />
            <span>{market.upvotes || 0}</span>
          </button>
        </div>

        {/* Question */}
        <h3 className="text-lg font-bold text-white leading-snug mb-6 line-clamp-2 min-h-[3.5rem] group-hover:text-electric-blue transition-colors">
          {market.question}
        </h3>

        {/* Price Indicators */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between text-[11px] font-mono font-bold uppercase tracking-widest">
            <div className="flex items-center gap-1.5 text-success-green">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>YES {yesPercent.toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-red-500">
              <span>NO {noPercent.toFixed(0)}%</span>
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="h-1.5 w-full bg-red-500/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-success-green transition-all duration-500 ease-out shadow-[0_0_10px_rgba(16,185,129,0.3)]"
              style={{ width: `${yesPercent}%` }}
            />
          </div>
        </div>

        {/* Metrics */}
        <div className="mt-auto pt-5 border-t border-white/5 flex items-center gap-6">
          <div className="flex items-center gap-2 text-slate-500">
            <BarChart3 className="w-4 h-4" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-tight">
              {volume}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Clock className="w-4 h-4" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-tight italic">
              {timeLeft}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-black/20 border-t border-white/5">
        <Link
          to={`/markets/${market.slug || market.id}`}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 text-white font-bold text-xs uppercase tracking-[0.2em] transition-all hover:bg-electric-blue hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] group/btn"
        >
          ANALYZE_MARKET
          <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </Link>
      </div>
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
