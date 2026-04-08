import { CheckCircle2, Copy, X, ArrowUpRight, Zap, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTxExplorerUrl, isExplorerAvailable } from '../../utils/explorer';

interface TxSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  txHash: string;
  title: string;
  subtitle: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function TxSuccessModal({
  isOpen,
  onClose,
  txHash,
  title,
  subtitle,
  primaryAction,
}: TxSuccessModalProps) {
  if (!isOpen) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(txHash);
    toast.success('Hash copied to clipboard');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm animate-in fade-in duration-300">
      {/* Backdrop overlay for closing */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-sm shadow-[0_0_50px_rgba(59,130,246,0.15)] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-electric-blue/10 blur-[100px]" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-success-green/10 blur-[100px]" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 flex flex-col items-center text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-success-green/10 rounded-full flex items-center justify-center mb-6 relative">
            <div className="absolute inset-0 bg-success-green/20 rounded-full animate-ping duration-1000 scale-75" />
            <CheckCircle2 className="w-10 h-10 text-success-green relative z-10" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight uppercase">
            {title}
          </h2>
          <p className="text-slate-400 text-sm font-light mb-8 max-w-xs">
            {subtitle}
          </p>

          {/* TX Hash Area */}
          <div className="w-full bg-black/40 border border-white/5 rounded-sm p-4 mb-8 text-left space-y-3 relative group">
            <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-widest text-slate-500 underline decoration-electric-blue/30 underline-offset-4">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-electric-blue" />
                Network Status
              </span>
              <span className="text-success-green">SUCCESSFUL</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-white/5 p-2 rounded-sm overflow-hidden">
                <p className="text-[10px] font-mono text-slate-300 truncate tracking-tight">
                  {txHash}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={copyToClipboard}
                  className="p-2 hover:bg-white/10 rounded-sm text-slate-500 hover:text-electric-blue transition-all"
                  title="Copy Hash"
                >
                  <Copy className="w-4 h-4" />
                </button>
                {isExplorerAvailable() && (
                  <a
                    href={getTxExplorerUrl(txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-white/10 rounded-sm text-slate-500 hover:text-electric-blue transition-all"
                    title="View on Explorer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="w-full space-y-3">
            {primaryAction && (
              <button
                onClick={primaryAction.onClick}
                className="w-full py-4 bg-electric-blue text-white rounded-sm font-bold text-xs hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] group/btn"
              >
                <span className="tracking-[0.1em]">View market</span>
                <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full py-3 border border-white/5 hover:bg-white/5 text-[10px] font-mono font-bold text-slate-500 transition-all uppercase tracking-widest"
            >
              Continue
            </button>
          </div>
        </div>

        {/* Footer info line */}
        <div className="px-8 py-3 bg-black/20 border-t border-white/5 flex items-center justify-center gap-2">
           <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
           <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
             Verified via Midnight Privacy Protocol
           </span>
        </div>
      </div>
    </div>
  );
}
