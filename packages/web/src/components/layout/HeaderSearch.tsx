import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { marketsApi } from '../../api/markets';
import { useDebounce } from '../../hooks/useDebounce';
import { Link, useNavigate } from 'react-router-dom';
import type { Market } from '../../types';

export function HeaderSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: results, isLoading } = useQuery({
    queryKey: ['search-markets', debouncedQuery],
    queryFn: () => (debouncedQuery.length >= 2 ? marketsApi.search(debouncedQuery, 5) : Promise.resolve([])),
    enabled: debouncedQuery.length >= 2,
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if ((event.altKey && event.key.toLowerCase() === 'k') || (event.metaKey && event.key.toLowerCase() === 'k')) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelect = (market: Market) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/markets/${market.slug || market.id}`);
  };

  return (
    <div className="flex-1 max-w-2xl hidden md:flex flex-col relative" ref={searchRef}>
      <div className={`
        flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-sm border transition-all
        ${isOpen ? 'border-electric-blue/50 bg-slate-900/80 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'border-white/10 hover:border-white/20'}
      `}>
        <Search className={`w-4 h-4 transition-colors ${isOpen ? 'text-electric-blue' : 'text-slate-500'}`} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search markets..."
          className="bg-transparent border-none text-sm text-slate-300 focus:outline-none w-full font-light"
        />
        {isLoading && <Loader2 className="w-3.5 h-3.5 text-electric-blue animate-spin" />}
        <div className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-sm text-[10px] text-slate-600 font-mono">
          <span>ALT</span>
          <span>K</span>
        </div>
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-sm shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1">
          {results && results.length > 0 ? (
            <div className="flex flex-col">
              <div className="px-4 py-2 bg-white/[0.02] border-b border-white/5 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                Search Results
              </div>
              {results.map((market) => (
                <button
                  key={market.id}
                  onClick={() => handleSelect(market)}
                  className="flex flex-col gap-1 p-4 hover:bg-white/5 text-left transition-colors border-b border-white/[0.02] last:border-0"
                >
                  <p className="text-sm font-bold text-slate-200 line-clamp-1">{market.question}</p>
                  <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 uppercase">
                    <span className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-electric-blue/40" />
                      {market.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {market.totalPositions} Traders
                    </span>
                  </div>
                </button>
              ))}
              <Link
                to={`/markets?q=${encodeURIComponent(query)}`}
                onClick={() => setIsOpen(false)}
                className="p-3 text-center bg-electric-blue/5 hover:bg-electric-blue/10 text-electric-blue text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all"
              >
                View all results
              </Link>
            </div>
          ) : !isLoading ? (
            <div className="p-8 text-center">
              <p className="text-xs font-mono text-slate-600 uppercase tracking-widest">No intelligence found</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
