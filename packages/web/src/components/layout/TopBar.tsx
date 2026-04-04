import { Wallet, Moon, ChevronDown, Zap, Monitor } from 'lucide-react';
import { useWallet } from '../../hooks/useWallet';
import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { WalletModal } from '../wallet/WalletModal';
import { WalletDetailView } from '../wallet/WalletDetailView';
import { useWalletStore } from '../../store/wallet.store';
import { HeaderSearch } from './HeaderSearch';
import { TerminalPairingModal } from '../wallet/TerminalPairing';

export function TopBar() {
  const { 
    isConnected, 
    isConnecting, 
    formattedAddress, 
    formattedUnshieldedNightBalance 
  } = useWallet();
  const { isWalletModalOpen, setWalletModalOpen } = useWalletStore();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);

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
          <span className="text-lg font-bold tracking-tight text-white hidden md:block">
            Shadow Market
          </span>
        </Link>
      </div>

      {/* Centered Search */}
      <HeaderSearch />

      {/* Actions & Profile */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 relative" ref={detailRef}>
          {isConnected ? (
            <>
              <Link
                to="/markets/create"
                className="hidden sm:flex px-4 py-2 bg-electric-blue text-white rounded-sm font-bold text-[10px] tracking-[0.2em] uppercase hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] items-center gap-2 mr-2 h-10"
              >
                <Zap className="w-3.5 h-3.5" />
                Create
              </Link>
              <button
                onClick={() => setIsPairingOpen(true)}
                className="hidden sm:flex px-4 py-2 bg-slate-800 text-white border border-white/5 rounded-sm font-bold text-[10px] tracking-[0.2em] uppercase hover:bg-slate-700 transition-all items-center gap-2 mr-2 h-10"
              >
                <Monitor className="w-3.5 h-3.5" />
                Link Terminal
              </button>
              <button
                onClick={() => setIsDetailOpen(!isDetailOpen)}
                className={`flex items-center gap-3 pl-4 pr-2 py-1.5 bg-slate-900 border rounded-sm transition-all group ${
                  isDetailOpen
                    ? 'border-electric-blue border shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                    : 'border-white/10 hover:border-electric-blue/50'
                }`}
              >
                <div className="flex items-center gap-4 mr-1">
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] text-slate-500 font-mono leading-none mb-1 uppercase tracking-tighter">
                      Unshielded
                    </span>
                    <span className="text-[10px] text-white font-mono font-bold leading-none">
                      {formattedUnshieldedNightBalance}
                    </span>
                  </div>
                </div>
                <div className="h-8 w-[1px] bg-white/10 mx-1" />
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-electric-blue/20 rounded-full flex items-center justify-center border border-electric-blue/40">
                    <Wallet className="w-3.5 h-3.5 text-electric-blue" />
                  </div>
                  <span className="text-xs text-slate-300 font-mono font-bold group-hover:text-white transition-colors">
                    {formattedAddress}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-all ${isDetailOpen ? 'rotate-180' : ''}`}
                  />
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
              {isConnecting ? 'CONNECTING...' : 'Connect wallet'}
            </button>
          )}
        </div>
      </div>

      <WalletModal isOpen={isWalletModalOpen} onClose={() => setWalletModalOpen(false)} />
      <TerminalPairingModal isOpen={isPairingOpen} onClose={() => setIsPairingOpen(false)} />
    </header>
  );
}
