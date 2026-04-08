import { TrendingUp, Users, ArrowUpRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import type { Market } from '../../types';

interface MarketIntelligenceCardProps {
  market: Market;
}

function formatCurrency(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return '0 NIGHT';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M NIGHT`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K NIGHT`;
  return `${num.toFixed(0)} NIGHT`;
}

export function MarketIntelligenceCard({ market }: MarketIntelligenceCardProps) {
  const yesPriceNum = parseFloat(market.yesPrice) * 100;
  const noPriceNum = parseFloat(market.noPrice) * 100;

  // Internal heuristic for sentiment
  const sentiment = yesPriceNum > 60 ? 'bullish' : yesPriceNum < 40 ? 'bearish' : 'neutral';

  const sentimentColor =
    sentiment === 'bullish'
      ? 'text-success-green'
      : sentiment === 'bearish'
        ? 'text-red-400'
        : 'text-slate-400';

  return (
    <div className="glass-card glass-shine group relative border-stealth bg-slate-900/40 rounded-sm overflow-hidden hover:bg-slate-900/60 hover-lift transition-all duration-300 flex flex-col h-full">
      
      {/* Header Info */}
      <div className="p-5 pb-2">
        <div className="flex justify-between items-start mb-3">
          <span className="px-2 py-0.5 bg-electric-blue/10 text-electric-blue text-[9px] font-mono font-bold uppercase tracking-widest rounded-full border border-electric-blue/20">
            {market.category}
          </span>
          <div className={`flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase ${sentimentColor}`}>
            <TrendingUp className="w-3.5 h-3.5" />
            {sentiment}
          </div>
        </div>

        <Link
          to={`/markets/${market.slug || market.id}`}
          className="block group-hover:text-electric-blue transition-colors"
        >
          <h3 className="text-xl font-bold leading-tight mb-3 line-clamp-2 min-h-[3.5rem]">{market.question}</h3>
        </Link>
      </div>

      {/* Probability Bars (Restructured) */}
      <div className="px-5 space-y-3 mb-6">
        <div className="flex justify-between items-end">
           <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 font-mono uppercase">Probability</span>
              <span className="text-2xl font-bold font-mono text-white leading-none">
                {yesPriceNum.toFixed(0)}% <span className="text-xs text-slate-500 font-normal">YES</span>
              </span>
           </div>
           <div className="text-right">
              <span className="text-[9px] text-slate-500 font-mono uppercase">Vol</span>
              <div className="text-sm font-bold font-mono text-slate-300">{formatCurrency(market.totalVolume)}</div>
           </div>
        </div>
        <div className="relative h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="absolute left-0 top-0 h-full bg-success-green transition-all duration-500" 
            style={{ width: `${yesPriceNum}%` }}
          />
          <div 
            className="absolute right-0 top-0 h-full bg-red-500/40 transition-all duration-500" 
            style={{ width: `${noPriceNum}%` }}
          />
        </div>
      </div>

      {/* Bottom Stats Grid */}
      <div className="mt-auto border-t border-white/5 bg-black/40 px-5 py-4">
        <div className="grid grid-cols-2 gap-8 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500">
               <Users className="w-3.5 h-3.5" />
               <span className="text-[9px] font-mono uppercase tracking-widest">Traders</span>
            </div>
            <div className="text-xs font-mono text-white font-bold">{market.totalBets.toLocaleString()}</div>
          </div>
          <div className="space-y-1 text-right">
            <div className="flex items-center gap-1.5 text-slate-500 justify-end">
               <Clock className="w-3.5 h-3.5" />
               <span className="text-[9px] font-mono uppercase tracking-widest">Expiry</span>
            </div>
            <div className="text-xs font-mono text-white font-bold">{format(new Date(market.endTime), 'MMM dd')}</div>
          </div>
        </div>

        <Link
          to={`/markets/${market.slug || market.id}`}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-electric-blue text-white rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all hover:brightness-110 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
        >
          View Market
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
