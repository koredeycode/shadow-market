import { 
  Shield, 
  TrendingUp, 
  Zap, 
  ChevronRight,
  BarChart3,
  Globe,
  Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MarketIntelligenceCard } from '../components/market/MarketIntelligenceCard';
import { CategoryBar } from '../components/market/CategoryBar';

// Mock featured markets for the overhaul demonstration
const featuredMarkets = [
  {
    id: '1',
    question: "Will Bitcoin hit $100k by end of Q2 2026?",
    description: "Prediction on BTC price action based on current market trends and institutional adoption.",
    category: "Crypto",
    totalVolume: "12400000",
    totalLiquidity: "4500000",
    yesPrice: "0.64",
    noPrice: "0.36",
    status: 'OPEN',
    tags: [],
    createdAt: new Date().toISOString(),
    endTime: new Date().toISOString(),
    minBet: '1',
    maxBet: '1000',
    totalPositions: 1250,
    onchainId: '1',
    contractAddress: '0x1',
    resolutionSource: 'CoinBase Oracle',
  },
  {
    id: '2',
    question: "US Presidential Election 2028: Will the Republican candidate win?",
    description: "Predict the outcome of the next US Presidential Election based on current political climate.",
    category: "Politics",
    totalVolume: "89000000",
    totalLiquidity: "21000000",
    yesPrice: "0.52",
    noPrice: "0.48",
    status: 'OPEN',
    tags: [],
    createdAt: new Date().toISOString(),
    endTime: new Date().toISOString(),
    minBet: '1',
    maxBet: '1000',
    totalPositions: 15400,
    onchainId: '2',
    contractAddress: '0x2',
    resolutionSource: 'Associated Press',
  },
  {
    id: '3',
    question: "Will SpaceX land humans on Mars before 2030?",
    description: "Speculate on SpaceX's ambitious timeline for Mars colonization.",
    category: "Tech",
    totalVolume: "2500000",
    totalLiquidity: "1100000",
    yesPrice: "0.31",
    noPrice: "0.69",
    status: 'OPEN',
    tags: [],
    createdAt: new Date().toISOString(),
    endTime: new Date().toISOString(),
    minBet: '1',
    maxBet: '1000',
    totalPositions: 850,
    onchainId: '3',
    contractAddress: '0x3',
    resolutionSource: 'Starbase Telemetry',
  },
  {
    id: '4',
    question: "Will Crude Oil (CL) hit $100 per barrel by end of March?",
    description: "Predict the price movement of NYMEX Crude Oil Futures.",
    category: "Finance",
    totalVolume: "65000000",
    totalLiquidity: "12000000",
    yesPrice: "0.33",
    noPrice: "0.67",
    status: 'OPEN',
    tags: [],
    createdAt: new Date().toISOString(),
    endTime: new Date().toISOString(),
    minBet: '1',
    maxBet: '1000',
    totalPositions: 4200,
    onchainId: '4',
    contractAddress: '0x4',
    resolutionSource: 'NYMEX Data',
  },
  {
    id: '5',
    question: "Will OpenAI release GPT-5 before June 2026?",
    description: "Speculate on the release window of the next frontier model from OpenAI.",
    category: "Tech",
    totalVolume: "12500000",
    totalLiquidity: "3200000",
    yesPrice: "0.45",
    noPrice: "0.55",
    status: 'OPEN',
    tags: [],
    createdAt: new Date().toISOString(),
    endTime: new Date().toISOString(),
    minBet: '1',
    maxBet: '1000',
    totalPositions: 2100,
    onchainId: '5',
    contractAddress: '0x5',
    resolutionSource: 'Dev Day Event',
  },
  {
    id: '6',
    question: "Will the Lakers win the NBA Championship 2026?",
    description: "Predict the winner of the 2026 NBA Finals.",
    category: "Sports",
    totalVolume: "5400000",
    totalLiquidity: "1200000",
    yesPrice: "0.15",
    noPrice: "0.85",
    status: 'OPEN',
    tags: [],
    createdAt: new Date().toISOString(),
    endTime: new Date().toISOString(),
    minBet: '1',
    maxBet: '1000',
    totalPositions: 3400,
    onchainId: '6',
    contractAddress: '0x6',
    resolutionSource: 'NBA Official',
  }
] as any[];

export function Home() {
  return (
    <div className="space-y-12 pb-20">
      <div className="-mx-4 md:-mx-8">
        <CategoryBar />
      </div>

      {/* Hero Section */}
      <section className="relative pt-12 glass-shine overflow-hidden rounded-lg">
        <div className="absolute -top-24 -left-20 w-96 h-96 bg-electric-blue/10 blur-[120px] rounded-full" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-accent/5 blur-[80px] rounded-full" />
        
        <div className="relative z-10 text-center space-y-8 max-w-4xl mx-auto">
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
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white">Featured Intelligence</h2>
            <p className="text-slate-500 text-sm">High-volume markets trending across the network.</p>
          </div>
          <Link to="/markets" className="text-electric-blue text-sm font-bold hover:underline flex items-center gap-1">
            VIEW ALL MARKETS <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredMarkets.map(market => (
            <MarketIntelligenceCard key={market.id} market={market} />
          ))}
        </div>
      </section>

      {/* Technology Section / Terminal Look */}
      <section className="relative overflow-hidden border-stealth bg-slate-900/20 p-12 rounded-sm group">
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
