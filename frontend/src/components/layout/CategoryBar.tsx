import {
  BarChart3,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Cloud,
  Coins,
  Cpu,
  Flame,
  Globe,
  Landmark,
  LayoutGrid,
  MoreHorizontal,
  Trophy
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';

const categories = [
  { name: 'All Markets', path: '/markets', icon: LayoutGrid },
  { name: 'Trending', path: '/markets?filter=trending', icon: Flame },
  { name: 'Crypto', path: '/markets?filter=Crypto', icon: Coins },
  { name: 'Politics', path: '/markets?filter=Politics', icon: Landmark },
  { name: 'Sports', path: '/markets?filter=Sports', icon: Trophy },
  { name: 'Finance', path: '/markets?filter=Finance', icon: BarChart3 },
  { name: 'Geopolitics', path: '/markets?filter=Geopolitics', icon: Globe },
  { name: 'Tech', path: '/markets?filter=Tech', icon: Cpu },
  { name: 'Economy', path: '/markets?filter=Economy', icon: CircleDollarSign },
  { name: 'Weather', path: '/markets?filter=Weather', icon: Cloud },
  { name: 'Elections', path: '/markets?filter=Elections', icon: CheckSquare },
  { name: 'Others', path: '/markets?filter=Others', icon: MoreHorizontal },
];

export function CategoryBar() {
  const [searchParams] = useSearchParams();
  const currentFilter = searchParams.get('filter');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="border-b border-white/5 bg-obsidian/40 backdrop-blur-md sticky top-16 z-40 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8 relative group">
        {/* Left Arrow Indicator */}
        {showLeftArrow && (
          <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center bg-gradient-to-r from-obsidian via-obsidian/80 to-transparent pr-8 pl-4 lg:pl-8 pointer-events-none">
            <button 
              onClick={() => scroll('left')}
              className="p-1.5 bg-slate-900 border border-white/10 rounded-full text-slate-400 hover:text-white pointer-events-auto shadow-xl transition-all hover:scale-110 active:scale-95"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Right Arrow Indicator */}
        {showRightArrow && (
          <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center bg-gradient-to-l from-obsidian via-obsidian/80 to-transparent pl-8 pr-4 lg:pr-8 pointer-events-none">
            <button 
              onClick={() => scroll('right')}
              className="p-1.5 bg-slate-900 border border-white/10 rounded-full text-slate-400 hover:text-white pointer-events-auto shadow-xl transition-all hover:scale-110 active:scale-95"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}

        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar scroll-smooth"
        >
          {categories.map(cat => {
            const isActive = (!currentFilter && cat.name === 'All Markets') || 
                           (currentFilter && cat.path.includes(`filter=${currentFilter}`));

            const Icon = cat.icon;

            return (
              <NavLink
                key={cat.name}
                to={cat.path}
                className={`
                  flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border
                  ${
                    isActive
                      ? 'bg-electric-blue/10 text-electric-blue border-electric-blue/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                      : 'text-slate-500 border-white/5 hover:text-slate-300 hover:bg-white/5'
                  }
                `}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-electric-blue' : 'text-slate-500'}`} />
                {cat.name}
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}
