import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLayoutEffect } from 'react';
import { format } from 'date-fns';
import { ArrowLeft, BarChart3, Clock, Info, Share2, ChevronUp } from 'lucide-react';
import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { marketsApi } from '../api/markets';
import { betsApi } from '../api/bets';
import { MarketChart } from '../components/market/MarketChart';
import { MarketStats } from '../components/market/MarketStats';
import { BettingTerminal } from '../components/wager/BettingTerminal';
import { P2PWagersList } from '../components/wager/P2PWagersList';
import { P2PActionTerminal } from '../components/wager/P2PActionTerminal';
import { MarketHistory } from '../components/market/MarketHistory';
import { MarketStatus, Wager } from '../types';
import { socket } from '../lib/socket';
import { TxSuccessModal } from '../components/common/TxSuccessModal';

export function MarketDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  // Determine active tab based on location path
  const activeTab = useMemo(() => {
    if (location.pathname.endsWith('/wagers')) return 'p2p';
    if (location.pathname.endsWith('/history')) return 'history';
    return 'chart';
  }, [location.pathname]);
  
  const [terminalMode, setTerminalMode] = useState<'pool' | 'p2p'>('pool');
  
  // Sync terminal mode with active tab on mount/navigation
  useLayoutEffect(() => {
    if (activeTab === 'p2p') setTerminalMode('p2p');
    else if (activeTab === 'chart') setTerminalMode('pool');
  }, [activeTab]);

  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d' | 'all'>('24h');
  const [selectedWager, setSelectedWager] = useState<Wager | null>(null);
  const [successData, setSuccessData] = useState<{ txHash: string; title: string; subtitle: string } | null>(null);

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

  useLayoutEffect(() => {
    if (!market?.id) return;

    socket.emit('subscribe:market', { marketId: market.id });

    const handleMarketUpdate = (updatedMarket: any) => {
      console.log('Real-time market update received', updatedMarket);
      queryClient.setQueryData(['market', slug], updatedMarket);
    };

    socket.on('market:updated', handleMarketUpdate);

    return () => {
      socket.emit('unsubscribe:market', { marketId: market.id });
      socket.off('market:updated', handleMarketUpdate);
    };
  }, [market?.id, slug, queryClient]);

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

  const { data: portfolio } = useQuery({
    queryKey: ['user-portfolio'],
    queryFn: () => betsApi.getPortfolio(),
    refetchInterval: 60000,
  });

  const marketBets = useMemo(() => {
    if (!portfolio || !market) return [];
    const active = portfolio.activeBets || [];
    const settled = portfolio.settledBets || [];
    return [...active, ...settled].filter(bet => bet.marketId === market.id);
  }, [portfolio, market]);

  const marketWagers = useMemo(() => {
    if (!portfolio || !market) return [];
    return (portfolio.wagers || []).filter(wager => wager.marketId === market.id);
  }, [portfolio, market]);

  const [positionType, setPositionType] = useState<'bets' | 'wagers'>('bets');

  const handleUpvote = async () => {
    if (!market) return;
    
    // Optimistic update
    const previousMarket = queryClient.getQueryData(['market', slug]);
    const isUpvoted = market.hasUpvoted;
    const newUpvotes = isUpvoted ? market.upvotes - 1 : market.upvotes + 1;
    
    queryClient.setQueryData(['market', slug], {
      ...market,
      hasUpvoted: !isUpvoted,
      upvotes: newUpvotes,
    });

    try {
      if (isUpvoted) {
        await marketsApi.removeUpvote(market.id);
        toast.success('Upvote removed');
      } else {
        await marketsApi.upvote(market.id);
        toast.success('Market upvoted');
      }
    } catch (err) {
      // Rollback on error
      queryClient.setQueryData(['market', slug], previousMarket);
      toast.error('Could not process upvote');
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
          View Markets
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-electric-blue/10 text-electric-blue text-[9px] font-mono font-bold uppercase tracking-widest rounded-full border border-electric-blue/20">
              {market.category}
            </span>
            <span className="text-[10px] text-slate-600 font-mono tracking-widest uppercase">
              ID: {market.id}
            </span>
          </div>
          
          <button
            onClick={handleUpvote}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${
              market.hasUpvoted
                ? 'bg-electric-blue/20 border-electric-blue text-electric-blue'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
            }`}
          >
            <ChevronUp className={`w-3.5 h-3.5 ${market.hasUpvoted ? 'text-white' : ''}`} />
            <span className="ml-1">UPVOTE</span>
            <span className="ml-2 border-l border-white/20 pl-2">{market.upvotes}</span>
          </button>
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

      {/* Main Grid: Visuals & Execution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Market Graphical Area */}
        <div className="glass-card glass-shine lg:col-span-8 border border-white/5 rounded-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="flex items-center border-b border-white/5 bg-black/40">
            <button
              onClick={() => navigate(`/markets/${slug}`)}
              className={`px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all border-r border-white/5 ${
                activeTab === 'chart'
                  ? 'text-electric-blue bg-electric-blue/5'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Pool Prediction
            </button>
            <button
              onClick={() => navigate(`/markets/${slug}/wagers`)}
              className={`px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all border-r border-white/5 ${
                activeTab === 'p2p'
                  ? 'text-electric-blue bg-electric-blue/5'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              P2P Wagers
            </button>
            <button
              onClick={() => navigate(`/markets/${slug}/history`)}
              className={`px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all border-r border-white/5 ${
                activeTab === 'history'
                  ? 'text-electric-blue bg-electric-blue/5'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Transactions
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
            {activeTab === 'chart' && (
              <div className="flex-1">
                <MarketChart marketId={market.id} timeRange={timeRange} />
              </div>
            )}
            
            {activeTab === 'p2p' && (
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

            {activeTab === 'history' && (
              <div className="flex-1">
                <MarketHistory marketId={market.id} />
              </div>
            )}
          </div>
        </div>

        {/* Execution Terminal */}
        <div className="lg:col-span-4 flex flex-col lg:sticky lg:top-8 self-start">
          <div className="glass-card glass-shine border border-white/10 rounded-sm overflow-hidden flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-white/5 bg-black/40 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setTerminalMode('pool')}
                  className={`text-[9px] font-bold font-mono tracking-widest uppercase transition-colors ${terminalMode === 'pool' ? 'text-electric-blue' : 'text-slate-500'}`}
                >
                  [ Pool Bet ]
                </button>
                <span className="text-white/10">|</span>
                <button 
                  onClick={() => setTerminalMode('p2p')}
                  className={`text-[9px] font-bold font-mono tracking-widest uppercase transition-colors ${terminalMode === 'p2p' ? 'text-electric-blue' : 'text-slate-500'}`}
                >
                  [ P2P Wager ]
                </button>
              </div>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-success-green animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
              </div>
            </div>
            <div className="p-1 flex-1">
              {terminalMode === 'p2p' ? (
                <P2PActionTerminal 
                  market={market} 
                  selectedWager={selectedWager}
                  onClearSelection={() => setSelectedWager(null)}
                  onSuccess={(data: { txHash: string; title: string; subtitle: string }) => setSuccessData(data)}
                />
              ) : (
                <BettingTerminal 
                  market={market} 
                  onSuccess={(data: { txHash: string; title: string; subtitle: string }) => setSuccessData(data)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full Width Collective Positions Section */}
      {(marketBets.length > 0 || marketWagers.length > 0) && (
        <section className="space-y-8 py-8 border-y border-white/5">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-1.5 h-8 bg-electric-blue" />
              Collective Positions
            </h3>
            <div className="flex bg-slate-900/60 p-1 rounded-sm border border-white/5">
              <button
                onClick={() => setPositionType('bets')}
                className={`px-6 py-2 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm transition-all ${
                  positionType === 'bets' ? 'bg-electric-blue text-white shadow-lg' : 'text-slate-500 hover:text-white'
                }`}
              >
                Pool Bets ({marketBets.length})
              </button>
              <button
                onClick={() => setPositionType('wagers')}
                className={`px-6 py-2 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm transition-all ${
                  positionType === 'wagers' ? 'bg-electric-blue text-white shadow-lg' : 'text-slate-500 hover:text-white'
                }`}
              >
                P2P Wagers ({marketWagers.length})
              </button>
            </div>
          </div>

          {positionType === 'bets' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketBets.map(pos => (
                <Link 
                  key={pos.id} 
                  to={`/portfolio/bets/${pos.id}`}
                  className="glass-card glass-shine group block p-6 space-y-4 hover:border-electric-blue/30 transition-all bg-slate-900/40"
                >
                  <div className="flex justify-between items-start">
                    <span className={`px-2 py-0.5 border rounded-sm text-[9px] font-mono font-bold uppercase tracking-widest ${
                      pos.side === 'yes' ? 'bg-success-green/10 text-success-green border-success-green/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>
                      {pos.side.toUpperCase()} SIDE
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono group-hover:text-electric-blue transition-colors uppercase">
                      View Receipt
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono text-slate-500 uppercase">Staked Amount</p>
                    <h3 className="text-2xl font-bold font-mono text-white">{pos.amount} <span className="text-xs font-normal text-slate-500">NIGHT</span></h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div>
                      <p className="text-[9px] font-mono text-slate-500 uppercase">Entry Price</p>
                      <p className="text-sm font-bold font-mono text-white">@{(parseFloat(pos.entryPrice) * 100).toFixed(1)}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-mono text-slate-500 uppercase">P/L (Current)</p>
                      <p className={`text-sm font-bold font-mono ${parseFloat(pos.profitLoss) >= 0 ? 'text-success-green' : 'text-red-500'}`}>
                        {parseFloat(pos.profitLoss) >= 0 ? '+' : ''}{parseFloat(pos.profitLoss).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketWagers.map(wager => (
                <Link 
                  key={wager.id} 
                  to={`/portfolio/wagers/${wager.id}`}
                  className="glass-card glass-shine block p-6 space-y-4 border border-white/5 bg-slate-900/40 hover:border-electric-blue/30 transition-all group"
                >
                   <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-sm text-[9px] font-mono font-bold uppercase tracking-widest">
                      P2P WAGER
                    </span>
                    <span className={`text-[10px] font-bold font-mono group-hover:text-electric-blue transition-colors ${
                      wager.status === 'MATCHED' ? 'text-success-green' : 'text-amber-500'
                    }`}>
                      {wager.status}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono text-slate-500 uppercase">Collateral</p>
                    <h3 className="text-2xl font-bold font-mono text-white">{wager.amount} <span className="text-xs font-normal text-slate-500">NIGHT</span></h3>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-white/5 text-[10px] font-mono font-bold uppercase">
                     <span className="text-slate-500">Side</span>
                     <span className={wager.creatorSide === 'yes' ? 'text-success-green' : 'text-red-500'}>{wager.creatorSide.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono font-bold uppercase">
                     <span className="text-slate-500">Odds</span>
                     <span className="text-electric-blue">{wager.odds[0]}:{wager.odds[1]}</span>
                  </div>
                </Link>
              ))}
              {marketWagers.length === 0 && (
                <div className="col-span-full py-12 text-center border border-dashed border-white/5 rounded-sm">
                   <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest underline decoration-white/10">No active peer-to-peer wagers for this market.</p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Tertiary Level: Information & Stats Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-12">
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Timeline Row */}
            <div className="space-y-4">
              <h3 className="text-white font-bold flex items-center gap-2 text-[10px] uppercase tracking-widest">
                <Clock className="w-3.5 h-3.5 text-electric-blue" />
                Market Timeline
              </h3>
              <div className="glass-card glass-shine border border-white/5 p-6 rounded-sm space-y-4">
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

        {/* Market Stats Card */}
        <div className="lg:col-span-4 space-y-8">
          <div className="glass-card glass-shine border border-white/5 p-8 rounded-sm space-y-8 bg-slate-900/40">
            <h3 className="text-white font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-4">
              <BarChart3 className="w-4 h-4 text-electric-blue" />
              Market Statistics
            </h3>
            <MarketStats market={market} />
          </div>
        </div>
      </div>
      {/* Tertiary Level... */}
      {/* (existing stats section) */}

      <TxSuccessModal 
        isOpen={!!successData}
        onClose={() => setSuccessData(null)}
        txHash={successData?.txHash || ''}
        title={successData?.title || ''}
        subtitle={successData?.subtitle || ''}
      />
    </div>
  );
}

export default MarketDetail;
