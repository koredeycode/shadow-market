import { Wallet, Bell, Search, Settings, Moon, ChevronDown } from 'lucide-react';
import { useWallet } from '../../hooks/useWallet';
import { Link, NavLink } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { WalletModal } from '../wallet/WalletModal';
import { WalletDetailView } from '../wallet/WalletDetailView';
import { useWalletStore } from '../../store/wallet.store';

export function TopBar() {
  const { isConnected, isConnecting, formattedAddress, formattedBalance } = useWallet();
  const { isWalletModalOpen, setWalletModalOpen } = useWalletStore();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { name: 'Markets', path: '/markets' },
    { name: 'Portfolio', path: '/portfolio' },
    { name: 'Analytics', path: '/analytics' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (detailRef.current && !detailRef.current.contains(event.target as Node)) {
        setIsDetailOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 border-b border-white/10 glass bg-obsidian/80 z-50 px-4 md:px-8 flex items-center justify-between gap-4">
      {/* Logo & Primary Nav */}
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-electric-blue rounded-sm flex items-center justify-center transition-transform group-hover:scale-105">
            <Moon className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white hidden md:block">Shadow Market</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                px-4 py-2 text-sm font-bold uppercase tracking-widest transition-all rounded-sm
                ${isActive 
                  ? 'text-electric-blue bg-electric-blue/5' 
                  : 'text-slate-500 hover:text-white hover:bg-white/5'}
              `}
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Centered Search */}
      <div className="flex-1 max-w-2xl hidden md:flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-sm border border-white/10 group focus-within:border-electric-blue/50 transition-all">
        <Search className="w-4 h-4 text-slate-500 group-focus-within:text-electric-blue transition-colors" />
        <input 
          type="text" 
          placeholder="Search markets, assets, or users..." 
          className="bg-transparent border-none text-sm text-slate-300 focus:outline-none w-full font-light"
        />
        <div className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-sm text-[10px] text-slate-600 font-mono">
          <span>ALT</span>
          <span>K</span>
        </div>
      </div>

      {/* Actions & Profile */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 mr-2">
          <button className="p-2 text-slate-500 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 text-slate-500 hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 relative" ref={detailRef}>
          {isConnected ? (
            <>
              <button 
                onClick={() => setIsDetailOpen(!isDetailOpen)}
                className={`flex items-center gap-3 pl-4 pr-2 py-1.5 bg-slate-900 border rounded-sm transition-all group ${
                  isDetailOpen ? 'border-electric-blue border shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'border-white/10 hover:border-electric-blue/50'
                }`}
              >
                <div className="flex flex-col items-end mr-1">
                  <span className="text-[10px] text-slate-500 font-mono leading-none mb-1 uppercase">Balance</span>
                  <span className="text-[11px] text-white font-mono font-bold leading-none">{formattedBalance}</span>
                </div>
                <div className="h-8 w-[1px] bg-white/10 mx-1" />
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-electric-blue/20 rounded-full flex items-center justify-center border border-electric-blue/40">
                    <Wallet className="w-3.5 h-3.5 text-electric-blue" />
                  </div>
                  <span className="text-xs text-slate-300 font-mono font-bold group-hover:text-white transition-colors">{formattedAddress}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-all ${isDetailOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>
              {isDetailOpen && <WalletDetailView onClose={() => setIsDetailOpen(false)} />}
            </>
          ) : (
            <button 
              onClick={() => setWalletModalOpen(true)}
              disabled={isConnecting}
              className="px-6 py-2.5 bg-electric-blue text-white rounded-sm font-bold text-xs tracking-[0.15em] uppercase hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)] flex items-center gap-2 disabled:opacity-50"
            >
              {isConnecting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Wallet className="w-4 h-4" />
              )}
              {isConnecting ? 'CONNECTING...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>

      <WalletModal 
        isOpen={isWalletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />
    </header>
  );
}
