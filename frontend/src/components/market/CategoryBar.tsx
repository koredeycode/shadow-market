import { TrendingUp, Flame, Zap, Globe, Cpu, Coins, Trophy, Landmark } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const categories = [
  { name: 'All', path: '/markets', icon: Globe },
  { name: 'Trending', path: '/markets?filter=trending', icon: TrendingUp },
  { name: 'Breaking', path: '/markets?filter=breaking', icon: Flame },
  { name: 'New', path: '/markets?filter=new', icon: Zap },
  { name: 'Crypto', path: '/markets?filter=crypto', icon: Coins },
  { name: 'Tech', path: '/markets?filter=tech', icon: Cpu },
  { name: 'Sports', path: '/markets?filter=sports', icon: Trophy },
  { name: 'Finance', path: '/markets?filter=finance', icon: Landmark },
];

export function CategoryBar() {
  return (
    <div className="border-b border-white/5 bg-obsidian/40 backdrop-blur-sm sticky top-16 z-40 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar">
          {categories.map((cat) => (
            <NavLink
              key={cat.name}
              to={cat.path}
              className={({ isActive }) => `
                flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border
                ${isActive 
                  ? 'bg-electric-blue/10 text-electric-blue border-electric-blue/30' 
                  : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5'}
              `}
            >
              <cat.icon className="w-3.5 h-3.5" />
              {cat.name}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}
