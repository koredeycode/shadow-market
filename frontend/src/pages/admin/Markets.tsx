import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, Search, Shield, Star } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import type { AdminMarket, PaginatedResponse } from '../../types';

export function AdminMarkets() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();

  const { data, isLoading: _isLoading } = useQuery<PaginatedResponse<AdminMarket>>({
    queryKey: ['admin-markets', statusFilter, page],
    queryFn: () =>
      adminApi.getAllMarkets({
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 20,
        offset: page * 20,
      }),
  });

  const lockMutation = useMutation({
    mutationFn: (marketId: string) => adminApi.lockMarket(marketId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-markets'] }),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ marketId, outcome }: { marketId: string; outcome: number }) =>
      adminApi.resolveMarket(marketId, outcome),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-markets'] }),
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: (marketId: string) => adminApi.toggleMarketFeatured(marketId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-markets'] }),
  });

  const toggleVerifiedMutation = useMutation({
    mutationFn: (marketId: string) => adminApi.toggleMarketVerified(marketId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-markets'] }),
  });

  const markets = data?.items || [];
  const filteredMarkets = markets.filter(m =>
    m.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Market Management</h1>
          <p className="text-slate-400 text-sm">Lock, resolve, and moderate markets</p>
        </div>
        <Link
          to="/markets/create"
          className="px-6 py-2 bg-electric-blue text-white rounded-sm font-bold text-[10px] tracking-[0.2em] uppercase hover:brightness-110 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"
        >
          Create New Market
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search markets..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/[0.02] border border-white/10 rounded-sm text-white placeholder:text-slate-500 focus:border-electric-blue/50 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'OPEN', 'LOCKED', 'RESOLVED'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                statusFilter === status
                  ? 'bg-electric-blue text-white'
                  : 'bg-white/[0.02] text-slate-400 hover:bg-white/[0.05] border border-white/10'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Markets Table */}
      <div className="glass-shine rounded-sm border border-white/5 overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/[0.02] border-b border-white/5">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-mono text-slate-400 uppercase tracking-wider">
                Market
              </th>
              <th className="px-6 py-4 text-left text-xs font-mono text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-mono text-slate-400 uppercase tracking-wider">
                Volume
              </th>
              <th className="px-6 py-4 text-left text-xs font-mono text-slate-400 uppercase tracking-wider">
                Upvotes
              </th>
              <th className="px-6 py-4 text-left text-xs font-mono text-slate-400 uppercase tracking-wider">
                Flags
              </th>
              <th className="px-6 py-4 text-right text-xs font-mono text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredMarkets.map(market => (
              <tr key={market.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <Link
                    to={`/markets/${market.id}`}
                    className="text-white font-medium hover:text-electric-blue"
                  >
                    {market.question}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    {market.isFeatured && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-amber-accent bg-amber-accent/10 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3" /> FEATURED
                      </span>
                    )}
                    {market.isVerified && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-success-green bg-success-green/10 px-2 py-0.5 rounded-full">
                        <Shield className="w-3 h-3" /> VERIFIED
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`text-xs font-mono font-bold px-2 py-1 rounded-full ${
                      market.status === 'OPEN'
                        ? 'bg-success-green/10 text-success-green'
                        : market.status === 'LOCKED'
                          ? 'bg-amber-accent/10 text-amber-accent'
                          : market.status === 'RESOLVED'
                            ? 'bg-electric-blue/10 text-electric-blue'
                            : 'bg-slate-500/10 text-slate-500'
                    }`}
                  >
                    {market.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-slate-300">
                  ${(parseFloat(market.totalVolume) / 1000).toFixed(1)}K
                </td>
                <td className="px-6 py-4 text-sm font-mono text-slate-300">{market.upvotes}</td>
                <td className="px-6 py-4">
                  {market.reportCount > 0 && (
                    <span className="text-xs font-mono text-red-500 bg-red-500/10 px-2 py-1 rounded-full">
                      {market.reportCount} reports
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {market.status === 'OPEN' && (
                      <button
                        onClick={() => lockMutation.mutate(market.id)}
                        className="p-2 hover:bg-white/5 rounded-sm transition-colors group"
                        title="Lock Market"
                      >
                        <Lock className="w-4 h-4 text-slate-400 group-hover:text-amber-accent" />
                      </button>
                    )}
                    {market.status === 'LOCKED' && (
                      <>
                        <button
                          onClick={() =>
                            resolveMutation.mutate({ marketId: market.id, outcome: 1 })
                          }
                          className="px-3 py-1 bg-success-green/10 text-success-green text-xs font-mono rounded-sm hover:bg-success-green/20"
                          title="Resolve YES"
                        >
                          YES
                        </button>
                        <button
                          onClick={() =>
                            resolveMutation.mutate({ marketId: market.id, outcome: 0 })
                          }
                          className="px-3 py-1 bg-red-500/10 text-red-500 text-xs font-mono rounded-sm hover:bg-red-500/20"
                          title="Resolve NO"
                        >
                          NO
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => toggleFeaturedMutation.mutate(market.id)}
                      className="p-2 hover:bg-white/5 rounded-sm transition-colors"
                      title="Toggle Featured"
                    >
                      <Star
                        className={`w-4 h-4 ${market.isFeatured ? 'text-amber-accent fill-amber-accent' : 'text-slate-400'}`}
                      />
                    </button>
                    <button
                      onClick={() => toggleVerifiedMutation.mutate(market.id)}
                      className="p-2 hover:bg-white/5 rounded-sm transition-colors"
                      title="Toggle Verified"
                    >
                      <Shield
                        className={`w-4 h-4 ${market.isVerified ? 'text-success-green' : 'text-slate-400'}`}
                      />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.hasMore && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 bg-white/[0.02] border border-white/10 rounded-sm text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.05]"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!data.hasMore}
            className="px-4 py-2 bg-white/[0.02] border border-white/10 rounded-sm text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.05]"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminMarkets;
