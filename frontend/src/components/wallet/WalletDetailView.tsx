import {
  LogOut,
  Copy,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  ChevronRight,
  Zap,
  Briefcase,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useWallet } from '../../hooks/useWallet';
import { Link } from 'react-router-dom';

interface WalletDetailViewProps {
  onClose: () => void;
}

export function WalletDetailView({ onClose }: WalletDetailViewProps) {
  const {
    address,
    formattedAddress,
    addressDisplayMode,
    setAddressDisplayMode,
    formattedNightBalance,
    formattedUnshieldedNightBalance,
    formattedDustBalance,
    networkId,
    disconnectWallet,
    refreshBalance,
  } = useWallet();

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Address copied');
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    onClose();
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-slate-900 border border-white/10 rounded-sm shadow-2xl overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="p-4 bg-black/40 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success-green rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-mono font-bold text-success-green uppercase tracking-widest">
              {networkId || 'MIDNIGHT_TESTNET'}
            </span>
          </div>
          <button
            onClick={refreshBalance}
            className="p-1.5 text-slate-500 hover:text-white transition-colors hover:bg-white/5 rounded-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <div className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">
              Unshielded NIGHT
            </div>
            <div className="text-xl font-mono font-bold text-white flex items-baseline gap-2">
              {formattedUnshieldedNightBalance}
              <span className="text-xs text-slate-500 font-light">NIGHT</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">
                Shielded (Private)
              </div>
              <div className="text-sm font-mono font-bold text-white flex items-baseline gap-1">
                {formattedNightBalance}
                <span className="text-[10px] text-slate-500 font-light">NIGHT</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">
                Network Gas
              </div>
              <div className="text-sm font-mono font-bold text-white flex items-baseline gap-1">
                {formattedDustBalance}
                <span className="text-[10px] text-slate-500 font-light">tDUST</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">
              Address Mode
            </div>
            <div className="flex bg-black/40 border border-white/10 rounded-sm p-0.5">
              <button
                onClick={() => setAddressDisplayMode('unshielded')}
                className={`px-2 py-0.5 rounded-sm text-[9px] font-mono transition-all ${
                  addressDisplayMode === 'unshielded'
                    ? 'bg-electric-blue text-white shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                UNSHIELDED
              </button>
              <button
                onClick={() => setAddressDisplayMode('shielded')}
                className={`px-2 py-0.5 rounded-sm text-[9px] font-mono transition-all ${
                  addressDisplayMode === 'shielded'
                    ? 'bg-electric-blue text-white shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                SHIELDED
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-2 bg-black/20 border border-white/5 rounded-sm group transition-all hover:border-white/10">
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[10px] text-white font-mono truncate">
                {formattedAddress}
              </span>
              <span className="text-[8px] text-slate-500 font-mono uppercase tracking-tighter">
                {addressDisplayMode === 'shielded' ? 'Shielded Private Address' : 'Public Network Address'}
              </span>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={handleCopy}
                className="p-1.5 text-slate-600 hover:text-electric-blue transition-colors hover:bg-white/5 rounded-sm"
                title="Copy Address"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button 
                className="p-1.5 text-slate-600 hover:text-electric-blue transition-colors hover:bg-white/5 rounded-sm"
                title="View on Explorer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-1 pt-2">
          <Link
            to="/portfolio"
            onClick={onClose}
            className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded-sm transition-colors text-xs text-slate-400 hover:text-white group"
          >
            <div className="flex items-center gap-3">
              <Briefcase className="w-4 h-4 text-electric-blue" />
              <span>My Portfolio</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all" />
          </Link>

          <button className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded-sm transition-colors text-xs text-slate-400 hover:text-white group">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-electric-blue" />
              <span>Identity Settings</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all" />
          </button>

          <button
            onClick={handleDisconnect}
            className="w-full flex items-center gap-3 p-2 hover:bg-red-500/10 rounded-sm transition-colors text-xs text-red-500 group"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-bold uppercase tracking-tight">Disconnect Wallet</span>
          </button>
        </div>
      </div>

      <div className="bg-electric-blue/5 p-3 flex items-center gap-3 border-t border-white/5">
        <div className="p-1.5 bg-electric-blue/10 rounded-sm">
          <Zap className="w-3.5 h-3.5 text-electric-blue" />
        </div>
        <div className="text-[9px] text-slate-500 font-light leading-tight">
          Wallet connection is secured via encrypted ZK-proofs.
        </div>
      </div>
    </div>
  );
}
