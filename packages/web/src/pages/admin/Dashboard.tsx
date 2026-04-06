import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  BarChart3,
  CheckCircle,
  DollarSign,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { authApi } from '../../api/auth';
import type { AdminStats } from '../../types';
import { useContract } from '../../hooks/useContract';
import { contractManager } from '../../services/contract.service';
import { useWalletStore } from '../../store/wallet.store';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

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
  const queryClient = useQueryClient();
  const { isInitializing, protocolInitialized } = useContract();
  const { 
    data: stats, 
    isLoading: isStatsLoading, 
    error: statsError,
    refetch: refetchStats 
  } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats(),
    refetchInterval: 60000,
    retry: false,
  });

  const [isInitializingContract, setIsInitializingContract] = useState(false);
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const isForbidden = (statsError as any)?.response?.status === 403;
  const isLoading = isStatsLoading || isInitializing;

  const { address: connectedAddress } = useWalletStore();
  const adminAddress = import.meta.env.VITE_ADMIN_ADDRESS;
  const isCorrectWallet = !adminAddress || connectedAddress === adminAddress;

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCorrectWallet) {
      toast.error('Unauthorized: Connect the correct admin wallet first');
      return;
    }
    
    setIsAdminLoggingIn(true);
    const id = toast.loading('Verifying admin credentials...');

    try {
      await authApi.adminClaim({ 
        username: adminUsername, 
        password: adminPassword 
      });
      toast.success('Admin access granted!', { id });
      setAdminPassword('');
      await refetchStats();
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Login failed';
      toast.error(msg, { id });
    } finally {
      setIsAdminLoggingIn(false);
    }
  };

  const handleInitialize = async () => {
    setIsInitializingContract(true);
    const id = toast.loading('Initializing protocol on-chain...');
    try {
      // @ts-ignore
      await contractManager.api?.initialize();
      toast.success('Protocol initialized successfully', { id });
    } catch (error: any) {
      console.error('Initialization failed:', error);
      toast.error(`Initialization failed: ${error.message}`, { id });
    } finally {
      setIsInitializingContract(false);
    }
  };

  if (!isCorrectWallet) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-full max-w-md p-8 glass-shine border border-white/5 rounded-sm text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-sm flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight">Access Denied</h1>
          <p className="text-slate-500 text-xs font-mono uppercase tracking-widest mb-8">
            Admin wallet connection required
          </p>
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm font-mono text-[10px] text-slate-400 break-all mb-4">
            REQUIRED: {adminAddress || 'NOT_CONFIGURED'}
          </div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">
            Please switch to the authorized admin wallet in your extension.
          </p>
        </div>
      </div>
    );
  }

  if (isForbidden) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-full max-w-md p-8 glass-shine border border-white/5 rounded-sm">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-electric-blue/10 rounded-sm flex items-center justify-center mb-4 border border-electric-blue/20">
              <Shield className="w-8 h-8 text-electric-blue" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight">Admin Terminal</h1>
            <p className="text-slate-500 text-xs font-mono uppercase tracking-widest">Authorized wallet connected. Enter credentials.</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                Username
              </label>
              <input
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                autoComplete="username"
                className="w-full bg-black/40 border border-white/5 rounded-sm px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-electric-blue/50 transition-colors"
                placeholder="ADMIN_ID"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                Password
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full bg-black/40 border border-white/5 rounded-sm px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-electric-blue/50 transition-colors"
                placeholder="********"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isAdminLoggingIn}
              className="w-full py-4 bg-electric-blue text-white rounded-sm font-bold text-xs tracking-[0.3em] uppercase hover:brightness-110 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)]"
            >
              {isAdminLoggingIn ? 'Verifying...' : 'Unlock Terminal'}
            </button>
          </form>
        </div>
      </div>
    );
  }

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
            {stats.totalBets.toLocaleString()}
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

      {/* Protocol Control */}
      <div className="glass-shine p-6 border border-white/5 rounded-sm bg-electric-blue/5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-electric-blue" />
              Protocol Control
            </h2>
            <p className="text-xs text-slate-500 mt-1">Global administrative operations</p>
          </div>
          {!protocolInitialized && (
            <button
              onClick={handleInitialize}
              disabled={isInitializingContract}
              className="px-6 py-2 bg-electric-blue text-white rounded-sm font-bold text-[10px] tracking-[0.2em] uppercase hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            >
              {isInitializingContract ? (
                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              Initialize Protocol
            </button>
          )}
          {protocolInitialized && (
            <div className="flex items-center gap-2 px-3 py-1 bg-success-green/10 border border-success-green/20 rounded-sm">
              <CheckCircle className="w-3.5 h-3.5 text-success-green" />
              <span className="text-[10px] font-mono text-success-green uppercase tracking-wider">
                Initialized
              </span>
            </div>
          )}
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
            to="/admin/market"
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
            to="/admin/contract-state"
            className="p-4 bg-white/[0.02] border border-white/5 rounded-sm hover:bg-white/[0.05] hover:border-electric-blue/30 transition-all group"
          >
            <Shield className="w-6 h-6 text-indigo-400 mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">Contract State</h3>
            <p className="text-xs text-slate-500">Live on-chain ledger explorer</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
