import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  BarChart3,
  ChevronRight,
  Clock,
  Loader2,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { marketsApi } from '../api/markets';
import { MarketIntelligenceCard } from '../components/market/MarketIntelligenceCard';
import type { Market, TrendingMarket } from '../types';

export function Home() {
  const { data: trendingMarkets, isLoading: loadingTrending } = useQuery<TrendingMarket[]>({
    queryKey: ['trending-markets'],
    queryFn: () => marketsApi.getTrending(3),
    refetchInterval: 10000,
  });

  const { data: newMarkets, isLoading: loadingNew } = useQuery<Market[]>({
    queryKey: ['new-markets'],
    queryFn: () => marketsApi.getNew(3),
    refetchInterval: 10000,
  });

  const {
    data: featuredMarkets,
    isLoading: loadingFeatured,
    isError,
  } = useQuery({
    queryKey: ['featured-markets'],
    queryFn: () => marketsApi.getAll({ limit: 15, status: 'OPEN' }),
  });

  const allFeaturedMarkets = featuredMarkets?.items || [];

  // Carousel logic
  const [currentIndex, setCurrentIndex] = useState(0);
  const featuredForCarousel = allFeaturedMarkets.slice(0, 5);

  useEffect(() => {
    if (featuredForCarousel.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % featuredForCarousel.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredForCarousel.length]);

  if (loadingFeatured || loadingTrending || loadingNew) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-10 h-10 text-electric-blue animate-spin" />
        <span className="text-xs font-mono text-slate-500 uppercase tracking-[0.3em]">
          Syncing with network...
        </span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-12 border border-dashed border-red-500/20 bg-red-500/5 rounded-sm flex flex-col items-center gap-4 mx-4">
        <AlertTriangle className="w-8 h-8 text-red-500" />
        <p className="text-sm font-mono text-red-400 uppercase tracking-widest text-center">
          Failed to establish p2p connection.
          <br />
          <span className="text-[10px] opacity-60">Please check your network status.</span>
        </p>
      </div>
    );
  }

  const currentFeatured = featuredForCarousel[currentIndex];

  return (
    <div className="space-y-12 pb-20 pt-8 px-4 md:px-0">
      {/* Top Hero + Sidebars Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Featured Market Carousel (Left) */}
        <div className="lg:col-span-8 flex flex-col">
          {currentFeatured && (
            <div className="relative group overflow-hidden rounded-sm border border-white/10 bg-slate-900/40 hover:border-electric-blue/30 transition-all duration-500 flex-1 min-h-[400px] flex flex-col">
              {/* Crossfade Layer */}
              <div
                key={currentFeatured.id}
                className="absolute inset-0 animate-in fade-in duration-1000 flex flex-col"
              >
                <div className="absolute top-0 right-0 p-6 flex flex-wrap justify-end gap-2 z-10">
                  <span className="px-3 py-1 bg-amber-accent/20 text-amber-accent text-[10px] font-mono font-bold uppercase tracking-widest rounded-full border border-amber-accent/30 backdrop-blur-sm">
                    Featured market
                  </span>
                  <span className="px-3 py-1 bg-electric-blue/20 text-electric-blue text-[10px] font-mono font-bold uppercase tracking-widest rounded-full border border-electric-blue/30 backdrop-blur-sm">
                    {currentFeatured.category}
                  </span>
                  <span className="px-3 py-1 bg-success-green/20 text-success-green text-[10px] font-mono font-bold uppercase tracking-widest rounded-full border border-success-green/30 backdrop-blur-sm">
                    Live
                  </span>
                </div>

                <div className="p-4 space-y-5 relative z-10 flex-1 flex flex-col justify-center">
                  <div className="space-y-3">
                    <h1 className="text-3xl font-bold text-white leading-tight tracking-tight group-hover:text-electric-blue transition-colors duration-300">
                      {currentFeatured.question}
                    </h1>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-xs font-mono text-slate-400">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-electric-blue" />
                      <span>
                        {(parseFloat(currentFeatured.totalVolume) / 1000).toFixed(1)}K NIGHT Vol
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-500" />
                      <span>{currentFeatured.totalBets} Traders</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>Ends {new Date(currentFeatured.endTime).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <Link
                      to={`/markets/${currentFeatured.slug || currentFeatured.id}`}
                      className="flex flex-col items-center justify-center p-6 bg-success-green/5 border border-success-green/20 rounded-sm group/btn hover:bg-success-green/10 transition-all"
                    >
                      <span className="text-[9px] font-mono text-success-green uppercase mb-2 tracking-widest">
                        Yes price
                      </span>
                      <span className="text-4xl font-mono font-bold text-success-green">
                        {Math.round(parseFloat(currentFeatured.yesPrice) * 100)}%
                      </span>
                    </Link>
                    <Link
                      to={`/markets/${currentFeatured.slug || currentFeatured.id}`}
                      className="flex flex-col items-center justify-center p-6 bg-red-500/5 border border-red-500/20 rounded-sm group/btn hover:bg-red-500/10 transition-all"
                    >
                      <span className="text-[9px] font-mono text-red-400 uppercase mb-2 tracking-widest">
                        No price
                      </span>
                      <span className="text-4xl font-mono font-bold text-red-500">
                        {Math.round(parseFloat(currentFeatured.noPrice) * 100)}%
                      </span>
                    </Link>
                  </div>

                  <div className="pt-4">
                    <Link
                      to={`/markets/${currentFeatured.slug || currentFeatured.id}`}
                      className="inline-flex items-center gap-2 px-8 py-4 bg-electric-blue text-white rounded-sm font-bold tracking-[0.1em] uppercase text-xs hover:brightness-110 transition-all shadow-[0_0_30px_rgba(59,130,246,0.2)]"
                    >
                      Trade this market
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Carousel Indicators */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {featuredForCarousel.map((_: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-1 transition-all duration-500 ${
                        idx === currentIndex ? 'w-6 bg-electric-blue' : 'w-1.5 bg-white/10'
                      } rounded-full`}
                    />
                  ))}
                </div>
              </div>

              {/* Decorative Background Effects */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-80 h-80 bg-electric-blue/5 blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-accent/5 blur-[80px]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Lists (Right) */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          {/* Trending Markets List */}
          <section className="flex flex-col bg-white/[0.02] border border-white/5 rounded-sm flex-1">
            <div className="p-4 border-b border-white/5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-electric-blue" />
                Trending now
              </h3>
            </div>
            <div className="flex-1">
              {trendingMarkets?.map((market, idx) => (
                <Link
                  key={market.id}
                  to={`/markets/${market.slug || market.id}`}
                  className={`flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group ${
                    idx !== trendingMarkets.length - 1 ? 'border-b border-white/[0.02]' : ''
                  }`}
                >
                  <span className="text-xs font-mono text-slate-600 w-4 font-bold">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors truncate">
                      {market.question}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase mt-1">
                      <span className="text-electric-blue">
                        {(parseFloat(market.totalVolume) / 1000).toFixed(1)}K NIGHT Vol
                      </span>
                      <span className="text-slate-800">|</span>
                      <span className="text-success-green">
                        {Math.round(parseFloat(market.yesPrice) * 100)}% YES
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-800 group-hover:text-electric-blue transition-colors" />
                </Link>
              ))}
            </div>
          </section>

          {/* New Markets List */}
          <section className="flex flex-col bg-white/[0.02] border border-white/5 rounded-sm pb-2">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-accent" />
                Fresh intel
              </h3>
              <span className="text-[10px] font-mono text-electric-blue animate-pulse">
                New data
              </span>
            </div>
            <div className="px-2 pt-2 space-y-1">
              {newMarkets?.slice(0, 3).map(market => (
                <Link
                  key={market.id}
                  to={`/markets/${market.slug || market.id}`}
                  className="block p-3 border border-transparent hover:border-white/5 hover:bg-white/[0.01] rounded-sm transition-all"
                >
                  <p className="text-xs font-bold text-slate-400 line-clamp-2 mb-2 group-hover:text-slate-200">
                    {market.question}
                  </p>
                  <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-widest text-slate-600">
                    <span className="flex items-center gap-1">{market.category}</span>
                    <span className="text-electric-blue/60 group-hover:text-electric-blue transition-colors">
                      Details
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="p-2">
              <Link
                to="/markets"
                className="block text-center py-2.5 text-[10px] font-mono font-bold text-electric-blue hover:underline uppercase tracking-[0.25em] bg-electric-blue/5 border border-electric-blue/10 rounded-sm"
              >
                Explore terminal
              </Link>
            </div>
          </section>
        </aside>
      </div>

      {/* Main Markets Grid (Full Width) */}
      <section className="space-y-8 pt-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <div className="w-1 h-6 bg-electric-blue" />
            Market intelligence
          </h2>
          <Link
            to="/markets"
            className="text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1"
          >
            Browse all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allFeaturedMarkets.slice(5).map((market: Market) => (
            <MarketIntelligenceCard key={market.id} market={market} />
          ))}
          {/* Fallback if not enough featured markets */}
          {allFeaturedMarkets.length <= 5 && (
            <div className="col-span-full border border-dashed border-white/5 p-12 text-center rounded-sm">
              <p className="text-sm font-mono text-slate-600 uppercase tracking-widest">
                No supplemental markets available.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;
