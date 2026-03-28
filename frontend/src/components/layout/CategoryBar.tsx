import { TrendingUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const CATEGORIES = [
  'Politics',
  'Sports',
  'Crypto',
  'Esports',
  'Iran',
  'Finance',
  'Geopolitics',
  'Tech',
  'Culture',
  'Economy',
  'Weather',
  'Mentions',
  'Elections',
];

export function CategoryBar() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  return (
    <div className="w-full border-b border-white/5 bg-obsidian/40 backdrop-blur-md sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-12 flex items-center justify-between gap-6 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-6 min-w-max">
          {/* Main Selectors */}
          <div className="flex items-center gap-4 pr-6 border-r border-white/10">
            <button
              className="flex items-center gap-2 text-sm font-bold text-white hover:text-electric-blue transition-colors group"
              onClick={() => setActiveCategory('trending')}
            >
              <TrendingUp className="w-4 h-4 text-electric-blue" />
              <span>Trending</span>
            </button>
            <button
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              onClick={() => setActiveCategory('breaking')}
            >
              Breaking
            </button>
            <button
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              onClick={() => setActiveCategory('new')}
            >
              New
            </button>
          </div>

          {/* Dynamic Categories */}
          <nav className="flex items-center gap-6">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`text-sm font-medium transition-colors whitespace-nowrap ${
                  activeCategory === cat
                    ? 'text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
            <button className="flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-white transition-colors">
              More
              <ChevronDown className="w-3 h-3" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
