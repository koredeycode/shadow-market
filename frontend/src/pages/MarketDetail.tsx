import { MarketStatus } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BarChart3, Clock, Info, Share2, Shield, Zap } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { marketsApi } from '../api/markets';
import { MarketChart } from '../components/market/MarketChart';
import { MarketStats } from '../components/market/MarketStats';
import { OrderBook } from '../components/market/OrderBook';
import { RecentTrades } from '../components/market/RecentTrades';
import { BettingTerminal } from '../components/wager/BettingTerminal';
import { P2PWagersList } from '../components/wager/P2PWagersList';

export function MarketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'chart' | 'p2p' | 'orders' | 'trades'>(
    'chart'
  );
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d' | 'all'>('24h');

  const {
    data: market,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['market', id],
    queryFn: () => marketsApi.getById(id!),
    enabled: !!id,
    // Disable auto-refetch - only refetch on manual refresh or navigation
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-12 h-12 border-4 border-electric-blue/20 border-t-electric-blue rounded-full animate-spin" />
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">
          Initializing Market Terminal...
        </p>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="py-12">
        <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-sm text-center space-y-4">
          <h2 className="text-red-400 font-bold uppercase tracking-wider">Synchronization Error</h2>
          <p className="text-red-300/60 text-sm font-light">
            Failed to establish connection with market data. Please verify the market ID and try
            again.
          </p>
          <Link
            to="/markets"
            className="inline-block px-6 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-sm text-xs font-bold hover:bg-red-500/20 transition-all"
          >
            RETURN_TO_MARKETS
          </Link>
        </div>
      </div>
    );
  }

  const statusColors: Record<MarketStatus, string> = {
    PENDING: 'border-slate-800 text-slate-500 bg-slate-800/10',
    OPEN: 'border-success-green/30 text-success-green bg-success-green/10',
    LOCKED: 'border-amber-500/30 text-amber-500 bg-amber-500/10',
    RESOLVED: 'border-slate-500/30 text-slate-400 bg-slate-500/10',
    CANCELLED: 'border-red-500/30 text-red-400 bg-red-500/10',
  };

  const statusColorClass = statusColors[market.status] || 'border-slate-800 text-slate-500';

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/markets')}
          className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-white transition-all font-mono text-[10px] uppercase font-bold tracking-widest group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Terminal Exit
        </button>

        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-500 hover:text-white transition-colors border border-white/5 bg-white/[0.02] rounded-sm">
            <Share2 className="w-4 h-4" />
          </button>
          <div className="h-6 w-[1px] bg-white/10 mx-1" />
          <div
            className={`px-3 py-1 border rounded-sm text-[10px] font-mono font-bold uppercase tracking-widest ${statusColorClass}`}
          >
            {market.status}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-electric-blue/10 text-electric-blue text-[9px] font-mono font-bold uppercase tracking-widest rounded-full border border-electric-blue/20">
                {market.category}
              </span>
              <span className="text-[10px] text-slate-600 font-mono tracking-widest uppercase">
                ID: {market.id.slice(0, 8)}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              {market.question}
            </h1>

            {market.description && (
              <p className="text-slate-400 font-light leading-relaxed max-w-4xl">
                {market.description}
              </p>
            )}
          </div>

          {/* Activity Section */}
          <div className="bg-slate-900/40 border-stealth rounded-sm overflow-hidden flex flex-col">
            <div className="flex items-center border-b border-white/5 bg-black/40">
              <button
                onClick={() => setActiveTab('chart')}
                className={`px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all border-r border-white/5 ${
                  activeTab === 'chart'
                    ? 'text-electric-blue bg-electric-blue/5'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Data_Visualizer
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all border-r border-white/5 ${
                  activeTab === 'orders'
                    ? 'text-electric-blue bg-electric-blue/5'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Order_Flow
              </button>
              <button
                onClick={() => setActiveTab('trades')}
                className={`px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all border-r border-white/5 ${
                  activeTab === 'trades'
                    ? 'text-electric-blue bg-electric-blue/5'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Market_History
              </button>
              <button
                onClick={() => setActiveTab('p2p')}
                className={`px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all ${
                  activeTab === 'p2p'
                    ? 'text-electric-blue bg-electric-blue/5'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Direct_Wagers
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'chart' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {(['1h', '24h', '7d', '30d', 'all'] as const).map(range => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-3 py-1.5 rounded-sm text-[10px] font-mono font-bold uppercase transition-all tracking-wider ${
                          timeRange === range
                            ? 'bg-electric-blue text-white shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                            : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                  <MarketChart marketId={market.id} timeRange={timeRange} />
                </div>
              )}
              {activeTab === 'orders' && <OrderBook marketId={market.id} />}
              {activeTab === 'trades' && <RecentTrades marketId={market.id} />}
              {activeTab === 'p2p' && <P2PWagersList marketId={market.id} />}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div className="space-y-4">
              <h3 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-widest">
                <Shield className="w-4 h-4 text-electric-blue" />
                Resolution Data
              </h3>
              <div className="bg-white/[0.02] border border-white/5 p-4 rounded-sm space-y-3">
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className="text-slate-500 uppercase">Provider</span>
                  <span className="text-white">Shadow_Oracle_v4</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className="text-slate-500 uppercase">Resolution Source</span>
                  <span className="text-white underline cursor-pointer hover:text-electric-blue transition-colors truncate max-w-[200px]">
                    {market.resolutionSource}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className="text-slate-500 uppercase">Settlement Period</span>
                  <span className="text-white">Within 24 Hours of Closure</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-widest">
                <Clock className="w-4 h-4 text-electric-blue" />
                Market Timeline
              </h3>
              <div className="bg-white/[0.02] border border-white/5 p-4 rounded-sm space-y-3">
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className="text-slate-500 uppercase">Creation Time</span>
                  <span className="text-white">
                    {new Date(market.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className="text-slate-500 uppercase">Target Expiry</span>
                  <span className="text-white">
                    {new Date(market.endTime).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 sticky top-24 space-y-6">
          <div className="space-y-4">
            <h2 className="text-white font-bold text-xs uppercase tracking-[0.25em] flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-electric-blue" />
              Execution_Terminal
            </h2>
            <BettingTerminal market={market} />
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-sm space-y-6">
            <h3 className="text-white font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-electric-blue" />
              Market Statistics
            </h3>
            <MarketStats market={market} />
          </div>

          <div className="flex items-start gap-4 p-4 border border-white/5 bg-white/[0.01] rounded-sm">
            <Info className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-500 font-light leading-relaxed">
              All transactions are processed through encrypted ZK-proofs. Your identity remains
              private while executing on-chain wagers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketDetail;
