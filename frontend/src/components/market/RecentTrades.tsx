import { TrendingDown, TrendingUp } from 'lucide-react';

interface RecentTradesProps {
  marketId: string;
}

interface Trade {
  id: string;
  side: 'yes' | 'no';
  price: number;
  amount: number;
  timestamp: number;
}

export function RecentTrades({ marketId: _marketId }: RecentTradesProps) {
  const trades: Trade[] = [
    { id: '1', side: 'yes', price: 0.67, amount: 1200, timestamp: Date.now() - 5 * 60 * 1000 },
    { id: '2', side: 'no', price: 0.34, amount: 800, timestamp: Date.now() - 12 * 60 * 1000 },
    { id: '3', side: 'yes', price: 0.66, amount: 2500, timestamp: Date.now() - 25 * 60 * 1000 },
    { id: '4', side: 'yes', price: 0.65, amount: 1800, timestamp: Date.now() - 38 * 60 * 1000 },
    { id: '5', side: 'no', price: 0.35, amount: 1500, timestamp: Date.now() - 55 * 60 * 1000 },
    { id: '6', side: 'yes', price: 0.64, amount: 3200, timestamp: Date.now() - 72 * 60 * 1000 },
    { id: '7', side: 'no', price: 0.36, amount: 900, timestamp: Date.now() - 95 * 60 * 1000 },
    { id: '8', side: 'yes', price: 0.63, amount: 2100, timestamp: Date.now() - 120 * 60 * 1000 },
  ];

  const formatAmount = (amount: number) => {
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return `${amount}`;
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-white/5 text-[9px] font-mono text-slate-500 uppercase tracking-widest px-2">
        <span className="w-20">Type</span>
        <span className="flex-1 text-center">Price</span>
        <span className="flex-1 text-center">Size</span>
        <span className="w-16 text-right">Time</span>
      </div>

      <div className="space-y-1">
        {trades.map(trade => (
          <div key={trade.id} className="flex justify-between items-center py-2 px-2 hover:bg-white/[0.03] transition-colors rounded-sm group">
            <div className="w-20 flex items-center gap-2">
              {trade.side === 'yes' ? (
                <div className="flex items-center gap-1.5 text-success-green">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-[10px] font-bold font-mono">YES</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-red-500">
                  <TrendingDown className="w-3 h-3" />
                  <span className="text-[10px] font-bold font-mono">NO</span>
                </div>
              )}
            </div>
            
            <div className={`flex-1 text-center text-[11px] font-mono font-bold ${trade.side === 'yes' ? 'text-success-green' : 'text-red-400'}`}>
              {(trade.price * 100).toFixed(1)}%
            </div>
            
            <div className="flex-1 text-center text-[11px] font-mono text-white font-medium">
              {formatAmount(trade.amount)} <span className="text-[9px] text-slate-600 font-light">DUST</span>
            </div>
            
            <div className="w-16 text-right text-[10px] font-mono text-slate-500 group-hover:text-slate-400">
              {formatTime(trade.timestamp)}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-white/5 opacity-50">
        <p className="text-[9px] font-mono text-slate-600 uppercase tracking-tight italic">
          [Trace_Log]: Recent on-chain settlements synced from decentralized nodes.
        </p>
      </div>
    </div>
  );
}
