import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  BarChart3,
  CheckCircle,
  Clock,
  DollarSign,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import type { AdminStats } from '../../types';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: {
    value: string;
    positive: boolean;
  };
  color: string;
}

function StatCard({ title, value, icon: Icon, trend, color }: StatCardProps) {
  return (
    <div className="glass-shine p-6 rounded-sm border border-white/5 group hover:border-white/10 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-sm bg-${color}/10 border border-${color}/20`}>
          <Icon className={`w-5 h-5 text-${color}`} />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-mono font-bold ${trend.positive ? 'text-success-green' : 'text-red-500'}`}
          >
            {trend.positive ? '+' : ''}
            {trend.value}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{title}</p>
        <h3 className="text-3xl font-bold font-mono text-white">{value}</h3>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats(),
    refetchInterval: 30000,
  });

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-electric-blue/20 border-t-electric-blue rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-500 uppercase tracking-[0.3em]">
            Loading Dashboard...
          </span>
        </div>
      </div>
    );
  }

  const volumeChange = (
    (parseFloat(stats.last24hVolume) / parseFloat(stats.totalVolume)) *
    100
  ).toFixed(2);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-electric-blue" />
            Admin Dashboard
          </h1>
          <p className="text-slate-400 text-sm">Platform overview and control center</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-success-green/10 border border-success-green/20 rounded-sm">
          <div className="w-2 h-2 bg-success-green rounded-full animate-pulse" />
          <span className="text-xs font-mono text-success-green uppercase tracking-wider">
            System Operational
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Markets"
          value={stats.totalMarkets}
          icon={BarChart3}
          trend={{ value: `${stats.activeMarkets} active`, positive: true }}
          color="electric-blue"
        />
        <StatCard
          title="Total Volume"
          value={`$${(parseFloat(stats.totalVolume) / 1000000).toFixed(2)}M`}
          icon={DollarSign}
          trend={{ value: `${volumeChange}% 24h`, positive: parseFloat(volumeChange) > 0 }}
          color="success-green"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          trend={{ value: `+${stats.last24hUsers} 24h`, positive: true }}
          color="amber-accent"
        />
        <StatCard
          title="Platform Fees"
          value={`$${(parseFloat(stats.platformFees) / 1000).toFixed(2)}K`}
          icon={TrendingUp}
          color="electric-blue"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-shine p-6 border border-white/5 rounded-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-mono text-slate-400 uppercase tracking-wider">Positions</h3>
            <Activity className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">
            {stats.totalPositions.toLocaleString()}
          </p>
        </div>
        <div className="glass-shine p-6 border border-white/5 rounded-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-mono text-slate-400 uppercase tracking-wider">
              P2P Wagers
            </h3>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">
            {stats.totalWagers.toLocaleString()}
          </p>
        </div>
        <div className="glass-shine p-6 border border-white/5 rounded-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-mono text-slate-400 uppercase tracking-wider">
              24h Volume
            </h3>
            <TrendingUp className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">
            ${(parseFloat(stats.last24hVolume) / 1000).toFixed(2)}K
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-shine p-6 border border-white/5 rounded-sm">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-electric-blue" />
          Admin Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/markets"
            className="p-4 bg-white/[0.02] border border-white/5 rounded-sm hover:bg-white/[0.05] hover:border-electric-blue/30 transition-all group"
          >
            <BarChart3 className="w-6 h-6 text-electric-blue mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">Manage Markets</h3>
            <p className="text-xs text-slate-500">Lock, resolve, or cancel markets</p>
          </Link>
          <Link
            to="/admin/users"
            className="p-4 bg-white/[0.02] border border-white/5 rounded-sm hover:bg-white/[0.05] hover:border-electric-blue/30 transition-all group"
          >
            <Users className="w-6 h-6 text-amber-accent mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">Manage Users</h3>
            <p className="text-xs text-slate-500">View and moderate user accounts</p>
          </Link>
          <Link
            to="/admin/verification"
            className="p-4 bg-white/[0.02] border border-white/5 rounded-sm hover:bg-white/[0.05] hover:border-electric-blue/30 transition-all group"
          >
            <CheckCircle className="w-6 h-6 text-success-green mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">Verify Markets</h3>
            <p className="text-xs text-slate-500">Review and verify new markets</p>
          </Link>
          <Link
            to="/admin/activity"
            className="p-4 bg-white/[0.02] border border-white/5 rounded-sm hover:bg-white/[0.05] hover:border-electric-blue/30 transition-all group"
          >
            <Clock className="w-6 h-6 text-slate-400 mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">Activity Log</h3>
            <p className="text-xs text-slate-500">Monitor platform activity</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
