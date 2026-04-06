import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  BarChart3,
  Users,
  Wallet,
  ArrowUpRight,
  Loader2,
  Activity,
  Award,
} from 'lucide-react';
import { analyticsApi, CategoryStats, PlatformStats, TopMarket, TopTrader } from '../api/analytics';
import { MarketVolumeChart } from '../components/analytics/MarketVolumeChart';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: string;
}

function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden bg-slate-900/40 border border-white/10 rounded-sm p-6 backdrop-blur-sm transition-all hover:bg-slate-900/60 hover:border-electric-blue/20">
      <div className="flex justify-between items-start relative z-10">
        <div className="space-y-1">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em]">{title}</p>
          <p className="text-2xl font-mono font-bold text-white tracking-tighter">{value}</p>
          {trend && (
            <div className="flex items-center gap-1.5 pt-1">
              <TrendingUp className="w-3 h-3 text-success-green" />
              <span className="text-[9px] font-mono text-success-green font-bold uppercase">
                {trend}
              </span>
            </div>
          )}
        </div>
        <div className="p-3 bg-white/5 border border-white/5 rounded-sm group-hover:bg-electric-blue/10 group-hover:border-electric-blue/20 transition-all">
          <Icon className="w-5 h-5 text-slate-400 group-hover:text-electric-blue transition-colors" />
        </div>
      </div>
      <div className="absolute -bottom-1 -right-1 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-16 h-16 text-slate-400" />
      </div>
    </div>
  );
}

export function Analytics() {
  const [activeTab, setActiveTab] = useState(0);

  const { data: platformStats, isLoading: statsLoading } = useQuery<PlatformStats>({
    queryKey: ['platform-stats'],
    queryFn: () => analyticsApi.getPlatformStats(),
    refetchInterval: 60000,
  });

  const { data: topMarkets, isLoading: marketsLoading } = useQuery<TopMarket[]>({
    queryKey: ['top-markets'],
    queryFn: () => analyticsApi.getTopMarkets(10),
    refetchInterval: 60000,
  });

  const { data: topTraders, isLoading: tradersLoading } = useQuery<TopTrader[]>({
    queryKey: ['top-traders'],
    queryFn: () => analyticsApi.getTopTraders(10),
    refetchInterval: 60000,
  });

  const { data: categoryStats, isLoading: categoriesLoading } = useQuery<CategoryStats[]>({
    queryKey: ['category-stats'],
    queryFn: () => analyticsApi.getCategoryStats(),
    refetchInterval: 60000,
  });

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    if (address.length <= 20) return address;
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const tabs = [
    { label: 'TOP_MARKETS', icon: BarChart3 },
    { label: 'TOP_TRADERS', icon: Award },
    { label: 'CATEGORIES', icon: Activity },
  ];

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <div className="space-y-4 max-w-4xl">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-electric-blue" />
          <h1 className="text-4xl font-bold text-white tracking-tight uppercase italic">
            Intelligence Terminal
          </h1>
        </div>
        <p className="text-slate-400 text-lg font-light leading-relaxed">
          Cross-network platform statistics, architectural trends, and execution metrics.
        </p>
      </div>

      {/* Platform Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-900/40 border border-white/10 rounded-sm" />
          ))}
        </div>
      ) : platformStats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Aggregated Volume"
            value={formatCurrency(platformStats.totalVolume)}
            icon={TrendingUp}
            trend="+12.4% / 24H"
          />
          <StatCard
            title="Deployed Protocols"
            value={platformStats.totalMarkets.toString()}
            icon={BarChart3}
          />
          <StatCard
            title="Authorized Identities"
            value={platformStats.totalUsers.toString()}
            icon={Users}
          />
          <StatCard
            title="Liquidity Safeguarded"
            value={formatCurrency(platformStats.totalValueLocked)}
            icon={Wallet}
          />
        </div>
      ) : null}

      {/* Main Chart */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-sm w-fit">
          <Activity className="w-3 h-3 text-electric-blue" />
          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">
            Network Throughput History
          </span>
        </div>
        <MarketVolumeChart height={450} />
      </section>

      {/* Leaderboards & Breakdown */}
      <section className="bg-slate-900/40 border border-white/10 rounded-sm overflow-hidden backdrop-blur-sm">
        <div className="border-b border-white/5 bg-black/20 flex overflow-x-auto no-scrollbar">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`flex items-center gap-2 px-8 py-5 text-[11px] font-mono font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap min-w-[200px] hover:bg-white/[0.02] border-r border-white/5 ${
                activeTab === i
                  ? 'text-white border-b-2 border-b-electric-blue bg-white/[0.03]'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <tab.icon
                className={`w-4 h-4 ${activeTab === i ? 'text-electric-blue' : 'opacity-40'}`}
              />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-8">
          {/* Top Markets Tab */}
          {activeTab === 0 && (
            <div className="space-y-6">
              {marketsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.4em]">
                    Crawling Markets...
                  </span>
                </div>
              ) : topMarkets && topMarkets.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="pb-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest pl-2">
                          #
                        </th>
                        <th className="pb-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                          Protocol Question
                        </th>
                        <th className="pb-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                          Category
                        </th>
                        <th className="pb-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest text-right">
                          Volume
                        </th>
                        <th className="pb-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest text-right pr-2">
                          Positions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                      {topMarkets.map((market, index) => (
                        <tr
                          key={market.id}
                          className="group hover:bg-white/[0.01] transition-colors"
                        >
                          <td className="py-4 pl-2 font-mono text-[11px] text-slate-600">
                            {index + 1}
                          </td>
                          <td className="py-4 max-w-md">
                            <Link
                              to={`/markets/${market.slug || market.id}`}
                              className="text-xs font-bold text-white hover:text-electric-blue transition-colors flex items-center gap-2 group/link"
                            >
                              {market.question}
                              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                            </Link>
                          </td>
                          <td className="py-4">
                            <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-sm text-[9px] font-mono font-bold text-slate-400 uppercase tracking-tighter">
                              {market.category}
                            </span>
                          </td>
                          <td className="py-4 text-right font-mono text-xs text-white">
                            {formatCurrency(market.volume)}
                          </td>
                          <td className="py-4 text-right font-mono text-xs text-slate-400 pr-2">
                            {market.totalBets ?? '0'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 border border-dashed border-white/5 rounded-sm text-center">
                  <p className="text-xs font-mono text-slate-600 uppercase tracking-widest">
                    Index Empty: No Active Protocols Detected.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Top Traders Tab */}
          {activeTab === 1 && (
            <div className="space-y-6">
              {tradersLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.4em]">
                    Decoding Ledgers...
                  </span>
                </div>
              ) : topTraders && topTraders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="pb-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest pl-2">
                          #
                        </th>
                        <th className="pb-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                          Strategic Identity
                        </th>
                        <th className="pb-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest text-right">
                          Volume
                        </th>
                        <th className="pb-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest text-right">
                          P&L
                        </th>
                        <th className="pb-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest text-right pr-2">
                          Win Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                      {topTraders.map((trader, index) => (
                        <tr
                          key={trader.address}
                          className="group hover:bg-white/[0.01] transition-colors"
                        >
                          <td className="py-4 pl-2 font-mono text-[11px] text-slate-600">
                            {index + 1}
                          </td>
                          <td className="py-4 font-mono text-xs text-white">
                            {trader.username || formatAddress(trader.address)}
                          </td>
                          <td className="py-4 text-right font-mono text-xs text-white">
                            {formatCurrency(trader.totalVolume)}
                          </td>
                          <td
                            className={`py-4 text-right font-mono text-xs font-bold ${trader.profitLoss >= 0 ? 'text-success-green' : 'text-red-500'}`}
                          >
                            {trader.profitLoss >= 0 ? '+' : ''}
                            {formatCurrency(trader.profitLoss)}
                          </td>
                          <td className="py-4 text-right font-mono text-xs text-slate-400 pr-2">
                            {trader.winRate.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 border border-dashed border-white/5 rounded-sm text-center">
                  <p className="text-xs font-mono text-slate-600 uppercase tracking-widest">
                    No Competitor Profiles Found.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Category Breakdown Tab */}
          {activeTab === 2 && (
            <div className="space-y-6">
              {categoriesLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.4em]">
                    Calculating Sectors...
                  </span>
                </div>
              ) : categoryStats && categoryStats.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryStats.map(cat => (
                    <div
                      key={cat.category}
                      className="p-5 bg-white/[0.02] border border-white/5 rounded-sm hover:border-white/10 transition-all group"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <span className="px-2 py-0.5 bg-electric-blue/10 border border-electric-blue/20 rounded-sm text-[9px] font-mono font-bold text-electric-blue uppercase tracking-widest">
                          {cat.category}
                        </span>
                        <span className="text-[10px] font-mono text-slate-600 font-bold uppercase">
                          {cat.marketCount} Active
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-end">
                          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-tight">
                            Sector Volume
                          </p>
                          <p className="text-lg font-mono font-bold text-white tracking-tighter">
                            {formatCurrency(cat.volume)}
                          </p>
                        </div>
                        <div className="flex justify-between items-end">
                          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-tight">
                            Avg per Protocol
                          </p>
                          <p className="text-xs font-mono text-slate-400 font-bold">
                            {formatCurrency(cat.avgVolume)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 border border-dashed border-white/5 rounded-sm text-center">
                  <p className="text-xs font-mono text-slate-600 uppercase tracking-widest">
                    Classification Systems Offline.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="mt-8 text-center px-4">
        <p className="text-[10px] font-mono text-slate-700 uppercase tracking-[0.5em] leading-relaxed">
          Shadow Market Intelligence Unit // End-to-End Visibility Enabled
        </p>
      </div>
    </div>
  );
}

export default Analytics;
