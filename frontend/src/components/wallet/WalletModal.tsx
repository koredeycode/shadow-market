import { X, Shield, Zap } from 'lucide-react';
import { useWallet } from '../../hooks/useWallet';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const walletTypes = [
  { id: 'lace', name: 'Lace', icon: <div className="w-8 h-8 bg-electric-blue/20 rounded-full border border-electric-blue/40 flex items-center justify-center text-electric-blue font-bold">L</div>, description: 'Midnight Testnet Optimized' },
];

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { connectWallet, isConnecting } = useWallet();

  if (!isOpen) return null;

  const handleConnect = async (id: string) => {
    console.log(`Connecting to ${id}...`);
    await connectWallet();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[200] grid place-items-center w-screen h-screen bg-black/80 backdrop-blur-sm p-4 transition-all duration-300 animate-in fade-in"
      onClick={onClose}
    >
      {/* Modal Content - e.stopPropagation to prevent closing when clicking inside */}
      <div 
        className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-sm shadow-2xl overflow-hidden animate-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-black/40">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-electric-blue" />
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">Connect Wallet</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-slate-400 text-sm font-light leading-relaxed mb-6">
            Authorize your Lace vault to access the Shadow Network and execute confidential wagers.
          </p>

          <div className="space-y-3">
            {walletTypes.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleConnect(wallet.id)}
                disabled={isConnecting}
                className="w-full flex items-center gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-sm hover:border-electric-blue/50 hover:bg-white/[0.05] transition-all group disabled:opacity-50"
              >
                {wallet.icon}
                <div className="text-left flex-1">
                  <div className="text-sm font-bold text-white group-hover:text-electric-blue transition-colors">
                    {wallet.name}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase font-mono tracking-widest mt-0.5">
                    {wallet.description}
                  </div>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-electric-blue/10 border border-electric-blue/20 text-[9px] text-electric-blue font-bold uppercase tracking-tighter">
                  Authorized
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-sm bg-electric-blue/10 border border-electric-blue/20 flex items-center justify-center shrink-0 text-electric-blue">
              <Zap className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest leading-none">Confidential Connection</h4>
              <p className="text-[10px] text-slate-500 font-light leading-relaxed">
                Powered by Midnight's ZK-SNARE technology. Your identity remains private during all network interactions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
