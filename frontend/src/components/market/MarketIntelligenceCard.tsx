import { TrendingUp, Users, BarChart2, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Market } from '@/types';

interface MarketIntelligenceCardProps {
  market: Market;
}

function formatCurrency(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return '$0';
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
  return `$${num.toFixed(0)}`;
}

export function MarketIntelligenceCard({ market }: MarketIntelligenceCardProps) {
  const yesPriceNum = parseFloat(market.yesPrice) * 100;
  const noPriceNum = parseFloat(market.noPrice) * 100;
  
  // Internal heuristic for sentiment
  const sentiment = yesPriceNum > 60 ? 'bullish' : yesPriceNum < 40 ? 'bearish' : 'neutral';
  
  const sentimentColor = 
    sentiment === 'bullish' ? 'text-success-green' : 
    sentiment === 'bearish' ? 'text-red-400' : 'text-slate-400';

  return (
    <div className="group relative border-stealth bg-slate-900/40 rounded-sm overflow-hidden hover:bg-slate-900/60 hover-lift transition-all duration-300 flex flex-col h-full">
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col gap-1.5">
            <span className="px-2 py-0.5 bg-electric-blue/10 text-electric-blue text-[9px] font-mono font-bold uppercase tracking-widest rounded-full border border-electric-blue/20 w-fit">
              {market.category}
            </span>
            <span className={`text-[8px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm border w-fit ${
              market.status === 'OPEN' ? 'border-success-green/30 text-success-green bg-success-green/5' :
              market.status === 'LOCKED' ? 'border-amber-500/30 text-amber-500 bg-amber-500/5' :
              'border-slate-500/30 text-slate-500 bg-slate-500/5'
            }`}>
              {market.status}
            </span>
          </div>
          <div className={`flex items-center gap-1 text-[10px] font-mono font-bold uppercase transition-colors ${sentimentColor}`}>
            <TrendingUp className="w-3 h-3" />
            {sentiment}
          </div>
        </div>

        <Link to={`/markets/${market.id}`} className="block group-hover:text-electric-blue transition-colors">
          <h3 className="text-lg font-bold leading-tight mb-2 line-clamp-2">
            {market.question}
          </h3>
        </Link>
        <p className="text-slate-400 text-sm line-clamp-2 font-light mb-6">
          {market.description || "No description available for this market."}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-500">
              <BarChart2 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono uppercase tracking-tight">Volume</span>
            </div>
            <div className="text-sm font-mono text-white">{formatCurrency(market.totalVolume)}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-500">
              <Users className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono uppercase tracking-tight">Liquidity</span>
            </div>
            <div className="text-sm font-mono text-white">{formatCurrency(market.totalLiquidity)}</div>
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-white/5 bg-black/20 p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 bg-slate-950 border border-white/10 p-2 rounded-sm flex flex-col items-center">
            <span className="text-[9px] text-slate-500 font-mono uppercase">Yes</span>
            <span className="text-sm font-mono font-bold text-success-green">{yesPriceNum.toFixed(0)}%</span>
          </div>
          <div className="flex-1 bg-slate-950 border border-white/10 p-2 rounded-sm flex flex-col items-center">
            <span className="text-[9px] text-slate-500 font-mono uppercase">No</span>
            <span className="text-sm font-mono font-bold text-red-500">{noPriceNum.toFixed(0)}%</span>
          </div>
        </div>

        <Link 
          to={`/markets/${market.id}`}
          className="w-full flex items-center justify-center gap-2 py-3 bg-electric-blue/5 hover:bg-electric-blue text-electric-blue hover:text-white border border-electric-blue/20 hover:border-electric-blue rounded-sm text-xs font-bold transition-all duration-300 group/btn shadow-[0_4px_12px_rgba(59,130,246,0.1)] hover:shadow-[0_4px_20px_rgba(59,130,246,0.3)]"
        >
          <span className="tracking-[0.1em]">VIEW MARKET</span>
          <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
        </Link>
      </div>
    </div>
  );
}
