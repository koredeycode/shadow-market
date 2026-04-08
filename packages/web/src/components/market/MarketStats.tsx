import { BarChart3, Users, Clock, CheckCircle2, Database, TrendingUp } from 'lucide-react';
import { Market } from '../../types';

interface MarketStatsProps {
  market: Market;
}

const formatVolume = (volume: string): string => {
  const num = parseFloat(volume);
  if (isNaN(num)) return '0 NIGHT';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M NIGHT`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K NIGHT`;
  return `${num.toFixed(0)} NIGHT`;
};

const getTimeRemaining = (dateStr: string): string => {
  const now = Date.now();
  const endTime = new Date(dateStr).getTime();
  const diff = endTime - now;

  if (diff <= 0) return 'Market Closed';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;

  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${minutes}m left`;
};

export function MarketStats({ market }: MarketStatsProps) {
  const stats = [
    {
      icon: <BarChart3 className="w-4 h-4" />,
      label: 'Volume',
      value: formatVolume(market.totalVolume),
      textColor: 'text-white',
    },
    {
      icon: <Users className="w-4 h-4" />,
      label: 'Positions',
      value: market.totalBets.toLocaleString(),
      textColor: 'text-white',
    },
    {
      icon: <TrendingUp className="w-4 h-4 text-success-green" />,
      label: 'Yes Price',
      value: `${(parseFloat(market.yesPrice) * 100).toFixed(0)}%`,
      textColor: 'text-success-green',
    },
    {
      icon: <TrendingUp className="w-4 h-4 text-red-500" />,
      label: 'No Price',
      value: `${(parseFloat(market.noPrice) * 100).toFixed(0)}%`,
      textColor: 'text-red-500',
    },
    {
      icon: <Clock className="w-4 h-4" />,
      label: 'End Date',
      value: getTimeRemaining(market.endTime),
      textColor: 'text-amber-500',
    },
    {
      icon: <CheckCircle2 className="w-4 h-4" />,
      label: 'Genesis',
      value: new Date(market.createdAt).toLocaleDateString(),
      textColor: 'text-slate-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="space-y-1">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="opacity-50">{stat.icon}</span>
            <span className="text-[9px] font-mono uppercase tracking-widest">{stat.label}</span>
          </div>
          <div className={`text-xs font-mono font-bold ${stat.textColor}`}>{stat.value}</div>
        </div>
      ))}
    </div>
  );
}
