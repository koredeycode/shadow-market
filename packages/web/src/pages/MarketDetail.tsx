import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, BarChart3, Clock, Info, Share2, Zap } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { marketsApi } from '../api/markets';
import { MarketChart } from '../components/market/MarketChart';
import { MarketStats } from '../components/market/MarketStats';
import { BettingTerminal } from '../components/wager/BettingTerminal';
import { P2PWagersList } from '../components/wager/P2PWagersList';
import { P2PActionTerminal } from '../components/wager/P2PActionTerminal';
import { MarketStatus, Wager } from '../types';

export function MarketDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active tab based on location path
  const activeTab = location.pathname.endsWith('/wagers') ? 'p2p' : 'chart';
  
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d' | 'all'>('24h');
  const [selectedWager, setSelectedWager] = useState<Wager | null>(null);

  const {
    data: market,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['market', slug],
    queryFn: () => marketsApi.getById(slug!),
    enabled: !!slug,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  const handleShare = async () => {
    if (!market) return;
    
    const shareData = {
      title: `Shadow Market | ${market.question}`,
      text: market.description || `Check out this prediction market on Shadow Market: ${market.question}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('Shared successfully');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        toast.error('Could not share market');
      }
    }
  };

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
    <div className="space-y-12 pb-20">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/markets')}
          className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-white transition-all font-mono text-[10px] uppercase font-bold tracking-widest group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Terminal exit
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="p-2 text-slate-500 hover:text-white transition-colors border border-white/5 bg-white/[0.02] rounded-sm group/share relative"
            title="Share Market"
          >
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

      {/* Title and Info Sections */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-electric-blue/10 text-electric-blue text-[9px] font-mono font-bold uppercase tracking-widest rounded-full border border-electric-blue/20">
            {market.category}
          </span>
          <span className="text-[10px] text-slate-600 font-mono tracking-widest uppercase">
            ID: {market.id}
          </span>
        </div>

        <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight max-w-5xl">
          {market.question}
        </h1>

        {market.description && (
          <p className="text-slate-400 font-light leading-relaxed max-w-4xl text-lg">
            {market.description}
          </p>
        )}
      </div>

      {/* Unified Interaction Level */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Market Graphical Area */}
        <div className="lg:col-span-8 bg-slate-900/40 border border-white/5 rounded-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="flex items-center border-b border-white/5 bg-black/40">
            <button
              onClick={() => navigate(`/markets/${slug}`)}
              className={`px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all border-r border-white/5 ${
                activeTab === 'chart'
                  ? 'text-electric-blue bg-electric-blue/5'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Market Center
            </button>
            <button
              onClick={() => navigate(`/markets/${slug}/wagers`)}
              className={`px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all border-r border-white/5 ${
                activeTab === 'p2p'
                  ? 'text-electric-blue bg-electric-blue/5'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Wagers Hub
            </button>
            <div className="flex-1" />
            {activeTab === 'chart' && (
              <div className="px-4 flex items-center gap-2">
                {(['1h', '24h', '7d', 'all'] as const).map(range => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-2 py-1 rounded-sm text-[9px] font-mono font-bold uppercase transition-all tracking-wider ${
                      timeRange === range
                        ? 'text-electric-blue'
                        : 'text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-8 flex-1 flex flex-col">
            {activeTab === 'chart' ? (
              <div className="flex-1">
                <MarketChart marketId={market.id} timeRange={timeRange} />
              </div>
            ) : (
              <div className="space-y-6 flex-1">
                <div className="flex justify-between items-center bg-electric-blue/5 border border-electric-blue/20 p-4 rounded-sm">
                  <div className="space-y-1">
                      <h3 className="text-[10px] font-mono font-bold text-electric-blue uppercase tracking-widest leading-none">
                        Wager protocol interface
                      </h3>
                      <p className="text-[9px] text-slate-500 font-mono uppercase">Manage active P2P contracts</p>
                  </div>
                </div>
                <P2PWagersList 
                  marketId={market.id} 
                  selectedWagerId={selectedWager?.id}
                  onSelectWager={setSelectedWager}
                />
              </div>
            )}
          </div>
        </div>

        {/* Execution Terminal */}
        <div className="lg:col-span-4 flex flex-col h-full">
          <div className="bg-slate-900/40 border border-white/10 rounded-sm overflow-hidden flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-white/5 bg-black/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-electric-blue" />
                <h2 className="text-white font-bold text-[10px] uppercase tracking-[0.25em]">
                  {activeTab === 'p2p' ? 'P2P protocol terminal' : 'Execution terminal'}
                </h2>
              </div>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-success-green animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
              </div>
            </div>
            <div className="p-1 flex-1">
              {activeTab === 'p2p' ? (
                <P2PActionTerminal 
                  market={market} 
                  selectedWager={selectedWager}
                  onClearSelection={() => setSelectedWager(null)}
                />
              ) : (
                <BettingTerminal market={market} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Level: Stats & Social Proof */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Timeline Row */}
            <div className="space-y-4">
              <h3 className="text-white font-bold flex items-center gap-2 text-[10px] uppercase tracking-widest">
                <Clock className="w-3.5 h-3.5 text-electric-blue" />
                Market Timeline
              </h3>
              <div className="bg-slate-900/40 border border-white/5 p-6 rounded-sm space-y-4">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-500 uppercase">Creation time</span>
                  <span className="text-white">
                    {format(new Date(market.createdAt), 'EEEE, MMMM dd, yyyy h:mmaaa')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-500 uppercase">Target expiry</span>
                  <span className="text-white">
                    {format(new Date(market.endTime), 'EEEE, MMMM dd, yyyy h:mmaaa')}
                  </span>
                </div>
              </div>
            </div>

            {/* Protocol Row */}
            <div className="space-y-4">
              <h3 className="text-white font-bold flex items-center gap-2 text-[10px] uppercase tracking-widest">
                <Info className="w-3.5 h-3.5 text-slate-500" />
                Protocol Information
              </h3>
              <div className="bg-slate-900/40 border border-white/5 p-6 rounded-sm h-[106px] flex items-center">
                <p className="text-[10px] text-slate-500 font-light leading-relaxed">
                  All transactions are processed through encrypted ZK-proofs. Your identity remains
                  private while executing on-chain wagers within the Shadow Network.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Market Stats */}
        <div className="lg:col-span-4 bg-slate-900/40 border border-white/5 p-8 rounded-sm space-y-8">
          <h3 className="text-white font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-4">
            <BarChart3 className="w-4 h-4 text-electric-blue" />
            Market Statistics
          </h3>
          <MarketStats market={market} />
        </div>
      </div>
    </div>
  );
}

export default MarketDetail;
