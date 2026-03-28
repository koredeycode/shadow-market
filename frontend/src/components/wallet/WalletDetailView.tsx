import { 
  LogOut, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck,
  ChevronRight, 
  Zap,
  Briefcase
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
    formattedBalance, 
    networkId, 
    disconnectWallet, 
    refreshBalance 
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

        <div className="space-y-1">
          <div className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Wallet Balance</div>
          <div className="text-2xl font-mono font-bold text-white flex items-baseline gap-2">
            {formattedBalance}
            <span className="text-xs text-slate-500 font-light">DUST</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Account Address</div>
          <div className="flex items-center justify-between p-2 bg-black/20 border border-white/5 rounded-sm group">
            <span className="text-xs text-slate-300 font-mono truncate mr-2">{formattedAddress}</span>
            <div className="flex items-center gap-1">
              <button 
                onClick={handleCopy}
                className="p-1 text-slate-600 hover:text-electric-blue transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button className="p-1 text-slate-600 hover:text-electric-blue transition-colors">
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
