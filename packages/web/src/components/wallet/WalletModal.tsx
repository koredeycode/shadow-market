import { X, Shield, Zap, Copy, Key } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useWallet } from '../../hooks/useWallet';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const walletTypes = [
  {
    id: 'lace',
    name: 'Lace',
    icon: (
      <div className="w-8 h-8 bg-electric-blue/20 rounded-full border border-electric-blue/40 flex items-center justify-center text-electric-blue font-bold">
        L
      </div>
    ),
    description: 'Midnight Testnet Optimized',
  },
];

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { 
    connectWallet, 
    disconnectWallet, 
    isConnected, 
    isConnecting, 
    getUserSecretKey, 
    importUserSecretKey,
    formattedAddress 
  } = useWallet();

  const [importKey, setImportKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [setupStep, setSetupStep] = useState<'CHOICE' | 'GENERATE' | 'IMPORT' | 'DONE' | null>(null);

  const needsIdentity = isConnected && !getUserSecretKey();

  if (!isOpen) return null;

  const handleConnect = async (id: string) => {
    console.log(`Connecting to ${id}...`);
    await connectWallet();
    if (needsIdentity) setSetupStep('CHOICE');
  };

  const handleCopyKey = () => {
    const key = getUserSecretKey();
    if (key) {
      navigator.clipboard.writeText(key);
      toast.success('Identity key copied to clipboard');
    }
  };

  const handleGenerate = async () => {
    // We generate a 32-byte key
    const bytes = new Uint8Array(32);
    window.crypto.getRandomValues(bytes);
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    
    const success = await importUserSecretKey(hex);
    if (success) {
      setSetupStep('DONE');
      toast.success('New Identity Generated!');
    }
  };

  const handleImport = async () => {
    if (!importKey.trim()) return;
    const success = await importUserSecretKey(importKey.trim());
    if (success) {
      setImportKey('');
      setSetupStep('DONE');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center w-screen h-screen bg-black/80 backdrop-blur-sm p-4 transition-all duration-300 animate-in fade-in"
      onClick={onClose}
    >
      {/* Modal Content - e.stopPropagation to prevent closing when clicking inside */}
      <div
        className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-sm shadow-2xl overflow-hidden animate-in zoom-in duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-black/40">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-electric-blue" />
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">
              Connect Wallet
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {isConnected ? (
            <div className="space-y-6">
              {needsIdentity && setupStep !== 'DONE' ? (
                <div className="p-4 bg-electric-blue/5 border border-electric-blue/20 rounded-sm space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2 text-electric-blue">
                    <Zap className="w-4 h-4" />
                    <h3 className="text-xs font-bold uppercase tracking-widest">First-time Identity Setup</h3>
                  </div>
                  
                  {setupStep === 'CHOICE' ? (
                    <div className="space-y-3">
                      <p className="text-[10px] text-slate-400 font-mono uppercase leading-relaxed">
                        No ZK-Identity found for this session. Choose an option to continue.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => handleGenerate()}
                          className="py-2 bg-electric-blue text-white rounded-sm text-[10px] font-bold uppercase tracking-widest hover:brightness-110"
                        >
                          Generate New
                        </button>
                        <button 
                          onClick={() => setSetupStep('IMPORT')}
                          className="py-2 bg-white/5 text-white border border-white/10 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-white/10"
                        >
                          Import Existing
                        </button>
                      </div>
                    </div>
                  ) : setupStep === 'IMPORT' ? (
                    <div className="space-y-3">
                       <input 
                        type="text"
                        placeholder="Paste 64-char Hex Key..."
                        value={importKey}
                        onChange={(e) => setImportKey(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 p-2 rounded-sm text-[10px] font-mono text-white focus:border-electric-blue/40 outline-none"
                      />
                      <div className="flex gap-2">
                         <button 
                          onClick={handleImport}
                          className="flex-1 py-2 bg-electric-blue text-white rounded-sm text-[10px] font-bold uppercase tracking-widest"
                        >
                          Confirm Import
                        </button>
                        <button 
                          onClick={() => setSetupStep('CHOICE')}
                          className="px-3 py-2 bg-white/5 text-slate-400 rounded-sm text-[10px]"
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  {/* Connected Account Section */}
                  <div className="p-4 bg-white/[0.03] border border-white/5 rounded-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 uppercase font-mono">Status</span>
                      <span className="text-[10px] text-success-green font-bold uppercase tracking-widest flex items-center gap-1">
                        <div className="w-1 h-1 bg-success-green rounded-full animate-pulse" />
                        Encrypted Connection
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 uppercase font-mono">Address</span>
                      <span className="text-[11px] text-white font-mono">{formattedAddress}</span>
                    </div>
                    <button
                       onClick={disconnectWallet}
                       className="w-full mt-2 py-2 border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all text-[10px] font-bold uppercase tracking-widest rounded-sm"
                    >
                      Terminate Connection
                    </button>
                  </div>

                  {/* Secret Key Section */}
                  <div className="space-y-3">
                     <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-electric-blue" />
                        <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Identity Key Backup</h4>
                     </div>
                     
                     <div className="bg-black/40 border border-white/5 p-4 rounded-sm space-y-3 glass-shine">
                       <p className="text-[9px] text-slate-500 font-mono leading-relaxed uppercase">
                         This key is your portable ZK-identity. Required to claim winnings on other machines.
                       </p>
                       
                       <div className="flex gap-2">
                         <div className="flex-1 bg-white/5 p-2 rounded-sm overflow-hidden border border-white/5 relative">
                           <span className={`text-[10px] font-mono text-slate-400 truncate block ${!showKey ? 'blur-[3px] select-none' : ''}`}>
                             {getUserSecretKey() || 'NOT_INITIALIZED'}
                           </span>
                         </div>
                         <button 
                            onClick={() => setShowKey(!showKey)}
                            className="px-2 bg-white/5 hover:bg-white/10 rounded-sm text-[9px] text-white font-bold uppercase transition-all"
                          >
                            {showKey ? 'Hide' : 'Show'}
                          </button>
                         <button 
                            onClick={handleCopyKey}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-sm text-slate-400 hover:text-white transition-all"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                       </div>
                     </div>
                  </div>

                  {/* Import Section */}
                  <div className="pt-4 border-t border-white/5 space-y-3">
                     <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Restore Identity</h4>
                     <div className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="Enter Hex Identity Key..."
                          value={importKey}
                          onChange={(e) => setImportKey(e.target.value)}
                          className="flex-1 bg-black/40 border border-white/10 p-2 rounded-sm text-[10px] font-mono text-white focus:border-electric-blue/40 outline-none transition-all"
                        />
                        <button 
                          onClick={handleImport}
                          className="px-4 bg-electric-blue/20 text-electric-blue border border-electric-blue/30 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-electric-blue hover:text-white transition-all"
                        >
                          Import
                        </button>
                     </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <p className="text-slate-400 text-sm font-light leading-relaxed mb-6">
                Authorize your Lace vault to access the Shadow Network and execute confidential wagers.
              </p>

              <div className="space-y-3">
                {walletTypes.map(wallet => (
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
                  <h4 className="text-xs font-bold text-white uppercase tracking-widest leading-none">
                    Confidential Connection
                  </h4>
                  <p className="text-[10px] text-slate-500 font-light leading-relaxed">
                    Powered by Midnight's ZK-SNARE technology. Your identity remains private during all
                    network interactions.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
