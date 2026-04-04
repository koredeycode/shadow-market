import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Activity,
  Trophy,
  Clock,
  LayoutDashboard,
  Box as BoxIcon,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Portfolio as PortfolioData, positionsApi } from '../api/positions';
import { ExportDataButton } from '../components/analytics/ExportDataButton';
import { PositionsList } from '../components/portfolio/PositionsList';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  color: string;
}

function StatCard({ title, value, icon, trend, color }: StatCardProps) {
  return (
    <div className="bg-slate-900/40 border-stealth p-6 rounded-sm space-y-4 group hover:bg-slate-900/60 transition-all">
      <div className="flex justify-between items-start">
        <div className="p-2 bg-white/[0.03] border border-white/5 rounded-sm text-slate-400 group-hover:text-white group-hover:border-white/10 transition-all">
          {icon}
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-[10px] font-mono font-bold ${trend.positive ? 'text-success-green' : 'text-red-500'}`}
          >
            {trend.positive ? '+' : ''}
            {trend.value}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{title}</p>
        <h3 className={`text-2xl font-bold font-mono ${color}`}>{value}</h3>
      </div>
    </div>
  );
}

export function Portfolio() {
  const [activeTab, setActiveTab] = useState<'active' | 'settled'>('active');

  const {
    data: portfolio,
    isLoading,
    error,
    refetch,
  } = useQuery<PortfolioData>({
    queryKey: ['portfolio'],
    queryFn: () => positionsApi.getPortfolio(),
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-12 h-12 border-4 border-electric-blue/20 border-t-electric-blue rounded-full animate-spin" />
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">
          Synchronizing Portfolio Data...
        </p>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="py-12">
        <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-sm text-center space-y-4">
          <h2 className="text-red-400 font-bold uppercase tracking-wider">Authentication error</h2>
          <p className="text-red-300/60 text-sm font-light">
            Failed to securely retrieve portfolio records. Please verify your connection.
          </p>
          <button
            onClick={() => refetch()}
            className="px-6 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-sm text-xs font-bold hover:bg-red-500/20 transition-all uppercase tracking-widest"
          >
            Retry sync
          </button>
        </div>
      </div>
    );
  }

  if (!portfolio || !portfolio.stats) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-electric-blue" />
        <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">
          Initializing Portfolio Vault...
        </p>
      </div>
    );
  }

  const { activePositions, settledPositions, stats } = portfolio;

  const formatCurrency = (value: string) => {
    const num = parseFloat(value || '0');
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const totalPnLNum = parseFloat(stats?.totalProfitLoss || '0');
  const isProfitable = totalPnLNum >= 0;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-electric-blue">
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em]">
              Command center
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Portfolio profile</h1>
          <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">
            Vault ID: {Math.random().toString(36).slice(2, 10).toUpperCase()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-white/[0.02] border border-white/5 rounded-sm flex items-center gap-2">
            <Clock className="w-3 h-3 text-slate-500" />
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-tight">
              Last sync: Just now
            </span>
          </div>
          <ExportDataButton type="portfolio" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Net liquidity"
          value={formatCurrency(stats.totalValue)}
          icon={<Wallet className="w-5 h-5" />}
          color="text-white"
        />
        <StatCard
          title="Realized p/l"
          value={(isProfitable ? '+' : '') + formatCurrency(stats.totalProfitLoss)}
          icon={
            isProfitable ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />
          }
          trend={{
            value: `${((totalPnLNum / Math.max(parseFloat(stats.totalVolume || '1'), 1)) * 100).toFixed(1)}%`,
            positive: isProfitable,
          }}
          color={isProfitable ? 'text-success-green' : 'text-red-500'}
        />
        <StatCard
          title="Terminal precision"
          value={`${stats.winRate.toFixed(1)}%`}
          icon={<Trophy className="w-5 h-5" />}
          trend={{
            value: `${stats.totalWins}W / ${stats.totalLosses}L`,
            positive: stats.winRate >= 50,
          }}
          color="text-electric-blue"
        />
        <StatCard
          title="Aggregated volume"
          value={formatCurrency(stats.totalVolume)}
          icon={<Activity className="w-5 h-5" />}
          trend={{
            value: `AVG: ${formatCurrency(stats.averageBetSize)}`,
            positive: true,
          }}
          color="text-slate-300"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">

          <div className="bg-slate-900/40 border-stealth rounded-sm overflow-hidden flex flex-col">
            <div className="flex items-center border-b border-white/5 bg-black/40">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all border-r border-white/5 flex items-center gap-2 ${
                  activeTab === 'active'
                    ? 'text-electric-blue bg-electric-blue/5'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Activity className="w-3 h-3" />
                Active units ({activePositions.length})
              </button>
              <button
                onClick={() => setActiveTab('settled')}
                className={`px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all border-r border-white/5 flex items-center gap-2 ${
                  activeTab === 'settled'
                    ? 'text-electric-blue bg-electric-blue/5'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                Settled history ({settledPositions.length})
              </button>
            </div>

            <div className="p-0">
              <PositionsList
                positions={activeTab === 'active' ? activePositions : settledPositions}
                isActive={activeTab === 'active'}
                onClaimSuccess={() => refetch()}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/40 border-stealth p-6 rounded-sm space-y-6">
            <div className="flex items-center gap-2 text-white">
              <BoxIcon className="w-4 h-4 text-electric-blue" />
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest">
                Risk allocation
              </h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-mono uppercase">
                  <span className="text-slate-500">Capital utilized</span>
                  <span className="text-white">64%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-electric-blue w-[64%]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-mono uppercase">
                  <span className="text-slate-500">Unrealized exposure</span>
                  <span className="text-white">12%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 w-[12%]" />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <div className="flex items-start gap-3">
                <div className="w-1 h-1 rounded-full bg-success-green mt-1.5" />
                <p className="text-[10px] text-slate-500 leading-relaxed font-light">
                  Standard risk parameters detected. Your current exposure complies with the Shadow
                  Protocol safety margins.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-electric-blue/10 to-transparent border border-electric-blue/20 p-6 rounded-sm space-y-4">
            <h4 className="text-white font-bold text-xs uppercase tracking-widest">
              Advanced recon
            </h4>
            <p className="text-[10px] text-slate-400 font-light leading-relaxed font-mono italic">
              "Data is the ultimate currency. Analyze your patterns to out-trade the noise."
            </p>
            <button className="w-full py-2 bg-electric-blue text-white text-[10px] font-bold font-mono uppercase tracking-[0.2em] rounded-sm hover:bg-electric-blue/80 transition-all">
              Request detailed report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Portfolio;
