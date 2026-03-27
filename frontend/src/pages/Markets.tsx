import { MarketIntelligenceCard } from '@/components/market/MarketIntelligenceCard';
import { CategoryBar } from '@/components/market/CategoryBar';
import type { MarketFilters } from '@/types';
import { Search, Filter, ChevronDown, LayoutGrid } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { marketsApi } from '../api/markets';

export function Markets() {
  const [filters, setFilters] = useState<MarketFilters>({
    status: 'OPEN',
    sortBy: 'volume',
    limit: 20,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['markets', filters],
    queryFn: () => marketsApi.getAll(filters),
    refetchInterval: 10000,
  });

  return (
    <div className="space-y-10">
      <div className="-mx-4 md:-mx-8 -mt-8 mb-8">
        <CategoryBar />
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">Market Terminal</h1>
          <p className="text-slate-500 font-light">Real-time prediction markets across all categories.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/5 p-1 rounded-sm border border-white/10">
          <button className="px-3 py-1.5 bg-electric-blue text-white rounded-sm text-xs font-bold transition-all">
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button className="px-3 py-1.5 text-slate-500 hover:text-white rounded-sm text-xs font-bold transition-all">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none lg:min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by keyword..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-sm text-sm text-white focus:outline-none focus:border-electric-blue/50 transition-all font-light"
            />
          </div>
          
          <div className="flex items-center gap-2 bg-slate-900 border border-white/10 p-1 rounded-sm">
            <div className="relative group">
              <select 
                value={filters.status || 'OPEN'}
                onChange={e => setFilters({ ...filters, status: e.target.value as any })}
                className="appearance-none bg-black/40 text-slate-300 px-4 py-2 pr-10 hover:text-white focus:outline-none cursor-pointer transition-all uppercase font-mono text-[10px] font-bold tracking-widest rounded-sm border border-transparent hover:border-white/10"
              >
                <option value="OPEN">STATUS: OPEN</option>
                <option value="LOCKED">STATUS: LOCKED</option>
                <option value="RESOLVED">STATUS: RESOLVED</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none group-hover:text-electric-blue transition-colors" />
            </div>

            <div className="w-[1px] h-4 bg-white/10" />

            <div className="relative group">
              <select 
                value={filters.sortBy || 'volume'}
                onChange={e => setFilters({ ...filters, sortBy: e.target.value as any })}
                className="appearance-none bg-black/40 text-slate-300 px-4 py-2 pr-10 hover:text-white focus:outline-none cursor-pointer transition-all uppercase font-mono text-[10px] font-bold tracking-widest rounded-sm border border-transparent hover:border-white/10"
              >
                <option value="volume">SORT: VOLUME</option>
                <option value="liquidity">SORT: LIQUIDITY</option>
                <option value="ending_soon">SORT: END DATE</option>
                <option value="newest">SORT: NEWEST</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none group-hover:text-electric-blue transition-colors" />
            </div>
          </div>
        </div>

        <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest bg-white/[0.02] px-4 py-2 border border-white/5 rounded-full">
          Displaying {data?.items.length || 0} active markets
        </div>
      </div>

      {/* Markets Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-80 bg-white/[0.02] border border-white/5 animate-pulse rounded-sm" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 border border-red-500/20 bg-red-500/5 rounded-sm text-center space-y-3">
          <p className="text-red-400 font-medium">TERMINAL_ERROR: Failed to establish market connection.</p>
          <button className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-sm text-xs font-bold hover:bg-red-500/20 transition-all">
            RETRY_SYNC
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.items.map(market => (
              <MarketIntelligenceCard key={market.id} market={market} />
            ))}
          </div>

          {data?.items.length === 0 && (
            <div className="py-24 border border-dashed border-white/10 bg-white/[0.02] rounded-sm flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                <Search className="w-6 h-6 text-slate-600" />
              </div>
              <div className="text-center">
                <h3 className="text-slate-300 font-bold">No markets found</h3>
                <p className="text-slate-500 text-sm font-light">Try adjusting your filters or search keywords.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Markets;
