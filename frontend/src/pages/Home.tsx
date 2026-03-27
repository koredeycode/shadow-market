import { 
  Shield, 
  TrendingUp, 
  Zap, 
  ChevronRight,
  BarChart3,
  Globe,
  Lock,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MarketIntelligenceCard } from '../components/market/MarketIntelligenceCard';
import { CategoryBar } from '../components/market/CategoryBar';
import { marketsApi } from '../api/markets';

export function Home() {
  const { 
    data: markets, 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ['featured-markets'],
    queryFn: () => marketsApi.getAll({ limit: 6, status: 'OPEN' }),
  });

  const featuredMarkets = markets?.items || [];

  return (
    <div className="space-y-12 pb-20">
      <div className="-mx-4 md:-mx-8">
        <CategoryBar />
      </div>

      {/* Hero Section */}
      <section className="relative pt-12 glass-shine overflow-hidden rounded-lg">
        <div className="absolute -top-24 -left-20 w-96 h-96 bg-electric-blue/10 blur-[120px] rounded-full" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-accent/5 blur-[80px] rounded-full" />
        
        <div className="relative z-10 text-center space-y-8 max-w-4xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-electric-blue animate-pulse">
            <Zap className="w-3 h-3" />
            V2.0 LIVE ON MIDNIGHT TESTNET
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            Predict the <span className="text-electric-blue">Unseen</span>.<br />
            Trade with <span className="text-slate-400">Precision</span>.
          </h1>
          
          <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">
            The world's first privacy-first prediction market. Powered by Midnight's 
            Zero-Knowledge technology for total anonymity and absolute trust.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link 
              to="/markets" 
              className="px-8 py-4 bg-electric-blue text-white rounded-sm font-bold tracking-tight hover:brightness-110 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            >
              EXPLORE TERMINAL
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/markets/create" 
              className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-sm font-bold tracking-tight hover:bg-white/10 transition-all"
            >
              CREATE MARKET
            </Link>
          </div>
        </div>

        {/* Global Stats Bar */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-1 border-y border-white/5 bg-white/[0.02]">
          {[
            { label: 'Total Volume', value: '$124.5M', icon: BarChart3 },
            { label: 'Markets Active', value: '1,248', icon: Globe },
            { label: 'Privacy Safeguarded', value: '100%', icon: Shield },
            { label: 'Avg Liquidity', value: '$45K', icon: TrendingUp },
          ].map((stat, i) => (
            <div key={i} className="p-8 flex flex-col items-center justify-center group overflow-hidden relative">
              <div className="absolute inset-0 bg-electric-blue/0 group-hover:bg-electric-blue/[0.02] transition-colors" />
              <stat.icon className="w-5 h-5 text-slate-500 mb-3 group-hover:text-electric-blue transition-colors" />
              <span className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">{stat.label}</span>
              <span className="text-3xl font-mono font-bold text-white tracking-tighter">{stat.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Markets Section */}
      <section className="space-y-10">
        <div className="flex items-end justify-between border-b border-white/5 pb-6">
          <div className="space-y-1 text-left px-4">
            <h2 className="text-2xl font-bold text-white">Featured Intelligence</h2>
            <p className="text-slate-500 text-sm">High-volume markets trending across the network.</p>
          </div>
          <Link to="/markets" className="text-electric-blue text-sm font-bold hover:underline flex items-center gap-1 pr-4">
            VIEW ALL MARKETS <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-electric-blue animate-spin" />
            <span className="text-xs font-mono text-slate-500 uppercase tracking-[0.3em]">Synching with Network...</span>
          </div>
        ) : isError ? (
          <div className="p-12 border border-dashed border-red-500/20 bg-red-500/5 rounded-sm flex flex-col items-center gap-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <p className="text-sm font-mono text-red-400 uppercase tracking-widest text-center">
              Failed to Establish Peer-to-Peer Connection.<br />
              <span className="text-[10px] opacity-60">Retrying in 5s...</span>
            </p>
          </div>
        ) : featuredMarkets.length === 0 ? (
          <div className="p-12 border border-dashed border-white/5 bg-white/2 rounded-sm flex flex-col items-center gap-4 text-center">
            <p className="text-sm font-mono text-slate-500 uppercase tracking-widest">
              No active protocols detected.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
            {featuredMarkets.map(market => (
              <MarketIntelligenceCard key={market.id} market={market} />
            ))}
          </div>
        )}
      </section>

      {/* Technology Section / Terminal Look */}
      <section className="relative overflow-hidden border border-white/5 bg-slate-900/20 p-12 rounded-sm group mx-4">
        <div className="absolute top-0 right-0 p-4 font-mono text-[10px] text-slate-700 opacity-20 select-none hidden md:block">
          CPU_STATE: 0x4F2A<br />
          ZK_PROOF_STATUS: VERIFIED<br />
          NODE_LATENCY: 12ms
        </div>
        
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-success-green/10 rounded-full border border-success-green/20 text-success-green text-[10px] font-mono font-bold tracking-widest uppercase">
              Secure Architecture
            </div>
            <h2 className="text-3xl font-bold text-white leading-tight">
              Zero-Knowledge Infrastructure.<br />
              <span className="text-slate-500">Uncompromised Privacy.</span>
            </h2>
            <p className="text-slate-400 leading-relaxed font-light">
              Unlike traditional prediction markets, Shadow Market encrypts your positions at the 
              protocol level. Not even the platform can see your bets, ensuring your strategy remains 
              your ultimate competitive advantage.
            </p>
            <ul className="grid grid-cols-2 gap-4">
              {[
                { label: 'Anonymous Wagers', icon: Lock },
                { label: 'Instant Settlement', icon: Zap },
                { label: 'On-Chain Verifiability', icon: Shield },
                { label: 'Global Liquidity', icon: Globe },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                  <item.icon className="w-4 h-4 text-electric-blue" />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-black/60 border border-white/5 rounded-sm p-1 shadow-2xl relative">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-white/[0.02]">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/50" />
                <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                <div className="w-2 h-2 rounded-full bg-success-green/50" />
              </div>
              <span className="text-[10px] font-mono text-slate-600 uppercase">midnight_v2_core.sh</span>
            </div>
            <div className="p-6 font-mono text-xs space-y-2 text-slate-400 leading-relaxed">
              <div className="text-success-green">$ midnight-cli proof --generate --market=0x882...</div>
              <div className="pl-4 border-l border-white/5 opacity-60">
                &gt; Analyzing market structure... [DONE]<br />
                &gt; Encrypting wager amount... [DONE]<br />
                &gt; Generating ZK-SNARK proof... [DONE]<br />
                &gt; Broadcast to network...
              </div>
              <div className="text-electric-blue">TX_HASH: 0x9f...a812 (CONFIRMED)</div>
              <div className="pt-4 animate-pulse">_</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
