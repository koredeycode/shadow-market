import { MarketIntelligenceCard } from '../components/market/MarketIntelligenceCard';
import type { Market, MarketFilters, PaginatedResponse } from '../types';
import { Search, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { marketsApi } from '../api/markets';
import { useDebounce } from '../hooks/useDebounce';

export function Markets() {
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('filter');

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [filters, setFilters] = useState<MarketFilters>({
    status: 'OPEN',
    sortBy: 'volume',
    limit: 20,
    category: categoryFilter || undefined,
  });

  // Update filters when search params change
  useEffect(() => {
    setFilters(prev => ({ 
      ...prev, 
      category: (categoryFilter === 'trending' || categoryFilter === 'breaking' || categoryFilter === 'new') 
        ? undefined 
        : categoryFilter || undefined 
    }));
  }, [categoryFilter]);

  const { data, isLoading, error } = useQuery<PaginatedResponse<Market>>({
    queryKey: ['markets', filters, debouncedSearch],
    queryFn: async () => {
      // Normalize category from search params (ensure capitalization for backend enum)
      const normalizedCategory = categoryFilter 
        ? categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1).toLowerCase()
        : undefined;

      // Handle trending/breaking/new special filters by calling specific API methods
      if (categoryFilter === 'trending') {
        const items = await marketsApi.getTrending(20);
        return { items, total: items.length, page: 1, limit: 20, hasMore: false };
      }
      
      if (categoryFilter === 'breaking' || categoryFilter === 'new') {
        const items = await marketsApi.getNew(20);
        return { items, total: items.length, page: 1, limit: 20, hasMore: false };
      }

      if (debouncedSearch) {
        const items = await marketsApi.search(debouncedSearch, 20);
        return {
          items,
          total: items.length,
          page: 1,
          limit: 20,
          hasMore: false
        };
      }
      
      return marketsApi.getAll({ 
        ...filters, 
        category: (categoryFilter && !['trending', 'breaking', 'new'].includes(categoryFilter)) 
          ? normalizedCategory 
          : undefined 
      });
    },
    refetchInterval: 10000,
  });

  return (
    <div className="space-y-6 pt-2">

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none lg:min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
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
                <option value="OPEN">Status: open</option>
                <option value="LOCKED">Status: locked</option>
                <option value="RESOLVED">Status: resolved</option>
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
                <option value="volume">Sort: volume</option>
                <option value="liquidity">Sort: liquidity</option>
                <option value="ending_soon">Sort: end date</option>
                <option value="newest">Sort: newest</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none group-hover:text-electric-blue transition-colors" />
            </div>
          </div>
        </div>

        <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest bg-white/[0.02] px-4 py-2 border border-white/5 rounded-full">
          Displaying {data?.items?.length || 0} active markets
        </div>
      </div>

      {/* Markets Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div
              key={i}
              className="h-80 bg-white/[0.02] border border-white/5 animate-pulse rounded-sm"
            />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 border border-red-500/20 bg-red-500/5 rounded-sm text-center space-y-3">
          <p className="text-red-400 font-medium">
            TERMINAL_ERROR: Failed to establish market connection.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-sm text-xs font-bold hover:bg-red-500/20 transition-all">
            RETRY_SYNC
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.items?.map(market => (
              <MarketIntelligenceCard key={market.id} market={market} />
            ))}
          </div>

          {(data?.items?.length === 0 || !data?.items) && (
            <div className="py-24 border border-dashed border-white/10 bg-white/[0.02] rounded-sm flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                <Search className="w-6 h-6 text-slate-600" />
              </div>
              <div className="text-center">
                <h3 className="text-slate-300 font-bold">No markets found</h3>
                <p className="text-slate-500 text-sm font-light">
                  Try adjusting your filters or search keywords.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Markets;
