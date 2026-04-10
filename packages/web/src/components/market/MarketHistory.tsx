import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  History as HistoryIcon,
  Loader2,
  ShieldCheck,
  Hash,
  EyeOff,
  Info
} from 'lucide-react';
import { marketsApi } from '../../api/markets';
import { EmptyState } from '../common/EmptyState';

interface MarketHistoryProps {
  marketId: string;
}

export function MarketHistory({ marketId }: MarketHistoryProps) {
  const {
    data: history,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['market-history', marketId],
    queryFn: () => marketsApi.getHistory(marketId),
    enabled: !!marketId,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 text-electric-blue animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 p-6 bg-red-500/5 border border-red-500/20 rounded-sm">
        <p className="text-red-400 font-mono text-xs uppercase tracking-widest">
          Failed to fetch real-time trade ledger
        </p>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="py-12 text-center">
        <EmptyState 
          title="Genesis State" 
          description="No on-chain interactions recorded for this market protocol yet. The distributed ledger remains in its initial state."
          icon={<HistoryIcon className="w-10 h-10 text-slate-700/40" />}
          variant="minimal"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-success-green/10 rounded-sm">
            <ShieldCheck className="w-4 h-4 text-success-green" />
          </div>
          <div>
            <h3 className="text-white font-bold text-[11px] uppercase tracking-widest leading-none mb-1">
              Network Transactions
            </h3>
            <p className="text-[9px] text-slate-500 font-mono uppercase">Verified by Shadow Indexer</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-sm">
           <span className="text-[10px] font-mono text-electric-blue tabular-nums">
             {history.length} TX_SIGNALS
           </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
        <div className="space-y-4">
          {history.map((tx: any) => (
            <div 
              key={tx.id} 
              className="group p-4 bg-slate-900/40 border border-white/5 rounded-sm hover:border-electric-blue/30 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-6">
                {/* Visual indicator of execution */}
                <div className="flex flex-col items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                  <div className="w-1 h-3 bg-electric-blue rounded-full" />
                  <div className="w-1 h-1 bg-electric-blue rounded-full" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tight">Execution Hash</span>
                    <a 
                      href={`#`} // explorer link
                      className="text-[10px] font-mono text-electric-blue flex items-center gap-1 hover:underline"
                    >
                      <Hash className="w-3 h-3" />
                      {tx.txHash ? tx.txHash.slice(0, 12) + '...' : 'pending'}
                    </a>
                    <div className={`px-2 py-0.5 rounded-sm text-[9px] font-bold font-mono tracking-widest ${tx.type === 'P2P' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/20' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'}`}>
                       {tx.type || 'POOL'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <EyeOff className="w-3 h-3 text-slate-600" />
                     <span className="text-[11px] font-mono text-slate-500">
                       Signal: <span className="text-white/60 font-bold italic tracking-wider">ZK-SHIELDED</span>
                     </span>
                  </div>
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                  {format(new Date(tx.timestamp), 'HH:mm:ss')}
                </div>
                <div className="text-lg font-mono font-bold text-white tracking-tight">
                  {(Number(tx.entryPrice) * 100).toFixed(1)}% <span className="text-[9px] text-slate-600 uppercase font-bold ml-1">PRICE_AT_TX</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 p-4 bg-white/2 border border-white/5 rounded-sm flex items-start gap-3">
        <Info className="w-4 h-4 text-electric-blue shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-500 leading-relaxed font-mono uppercase">
          NOTICE: All transaction amounts and sides are shielded using Midnight ZK-Snarks. only the inclusion and execution price are public.
        </p>
      </div>
    </div>
  );
}
