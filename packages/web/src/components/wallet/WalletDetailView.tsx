import {
  LogOut,
  Copy,
  ExternalLink,
  RefreshCw,
  ChevronRight,
  Briefcase,
  Lock,
  Monitor,
  Fingerprint,
  Zap,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useWallet } from '../../hooks/useWallet';
import { Link } from 'react-router-dom';
import { getContractExplorerUrl, isExplorerAvailable } from '../../utils/explorer';
import { useMemo } from 'react';

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
    setTerminalModalOpen,
    getUserSecretKey,
    importUserSecretKey,
    proofServerUrl,
    proofServerOption,
    setProofServer,
    connectWallet,
    isConnected,
    walletType,
  } = useWallet();

  const userSecretKey = useMemo(() => getUserSecretKey(), [getUserSecretKey]);

  const formattedSecretKey = useMemo(() => {
    if (!userSecretKey) return 'KEYS_NOT_LOADED';
    return `${userSecretKey.slice(0, 8)}...${userSecretKey.slice(-8)}`;
  }, [userSecretKey]);

  const [isEditingKey, setIsEditingKey] = useState(false);
  const [newKey, setNewKey] = useState('');

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Address copied');
    }
  };

  const handleUpdateKey = async () => {
    if (!newKey || newKey.length < 64) {
      toast.error('Invalid key. Must be 64 hex characters.');
      return;
    }

    if (await importUserSecretKey(newKey, true)) {
      setIsEditingKey(false);
      setNewKey('');
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
              {isExplorerAvailable() ? (
                <a
                  href={getContractExplorerUrl(address || '')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-600 hover:text-electric-blue transition-colors hover:bg-white/5 rounded-sm"
                  title="View on Explorer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <button 
                  className="p-1.5 text-slate-600 hover:text-electric-blue transition-colors hover:bg-white/5 rounded-sm"
                  title="View on Explorer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="text-[9px] text-slate-500 font-mono uppercase tracking-widest flex items-center gap-2">
              <Fingerprint className="w-3 h-3 text-electric-blue" />
              ZK Identity Vault
            </div>
            <div className="p-2 bg-slate-900/80 border border-white/5 rounded-sm space-y-2">
               <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] text-slate-500 font-mono uppercase">Master Secret</span>
                    {!isEditingKey ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-white font-mono">{formattedSecretKey}</span>
                        <button 
                          onClick={() => {
                            setIsEditingKey(true);
                            setNewKey(userSecretKey || '');
                          }}
                          className="p-1 hover:bg-white/5 rounded-sm text-slate-400 hover:text-electric-blue transition-all"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={handleUpdateKey}
                          className="p-1 hover:bg-success-green/10 rounded-sm text-success-green transition-all"
                        >
                          <Check className="w-2.5 h-2.5" />
                        </button>
                        <button 
                          onClick={() => setIsEditingKey(false)}
                          className="p-1 hover:bg-red-500/10 rounded-sm text-red-500 transition-all"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {isEditingKey && (
                    <input
                      type="text"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      placeholder="Paste 64-char hex key..."
                      className="w-full bg-black/40 border border-white/10 p-1.5 rounded-sm text-[8px] text-white font-mono focus:border-electric-blue outline-none animate-in fade-in slide-in-from-top-1"
                    />
                  )}
               </div>

               <div className="flex justify-between items-center border-t border-white/5 pt-1.5">
                  <span className="text-[8px] text-slate-500 font-mono uppercase">Sync ID</span>
                  <span className="text-[9px] text-white font-mono">#{address?.slice(2, 8).toUpperCase()}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Proof Server Section */}
        <div className="space-y-2 pt-2 border-t border-white/5 px-4 mb-4">
          <div className="text-[9px] text-slate-500 font-mono uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-3 h-3 text-amber-500" />
            Proof Server Configuration
          </div>
          <div className="p-2 bg-slate-900/80 border border-white/5 rounded-sm space-y-3 font-mono">
            <div className="flex bg-black/40 border border-white/10 rounded-sm p-0.5">
              <button
                onClick={() => {
                  setProofServer('env');
                  if (isConnected) connectWallet(walletType || 'lace');
                }}
                className={`flex-1 px-1 py-1 rounded-sm text-[8px] transition-all ${
                  proofServerOption === 'env' ? 'bg-amber-500/20 text-amber-500 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                NETWORK
              </button>
              <button
                onClick={() => {
                  setProofServer('local');
                  if (isConnected) connectWallet(walletType || 'lace');
                }}
                className={`flex-1 px-1 py-1 rounded-sm text-[8px] transition-all ${
                  proofServerOption === 'local' ? 'bg-amber-500/20 text-amber-500 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                LOCAL
              </button>
              <button
                onClick={() => setProofServer('custom')}
                className={`flex-1 px-1 py-1 rounded-sm text-[8px] transition-all ${
                  proofServerOption === 'custom' ? 'bg-amber-500/20 text-amber-500 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                CUSTOM
              </button>
            </div>

            {proofServerOption === 'custom' && (
              <div className="flex gap-2 animate-in fade-in slide-in-from-top-1">
                <input 
                  type="text"
                  placeholder="http://..."
                  defaultValue={proofServerUrl || ''}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setProofServer('custom', e.currentTarget.value);
                      if (isConnected) connectWallet(walletType || 'lace');
                      toast.success('Proof server updated');
                    }
                  }}
                  className="w-full bg-black/40 border border-white/10 p-1.5 rounded-sm text-[9px] text-white focus:border-amber-500/40 outline-none"
                />
              </div>
            )}

            <div className="text-[8px] text-slate-500 break-all leading-tight px-1 uppercase">
              Active: <span className="text-amber-500/80">
                {proofServerOption === 'env' ? 'Internal SDK/Environment' : (proofServerUrl || 'localhost:6300')}
              </span>
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

          <button
            onClick={() => {
              setTerminalModalOpen(true);
              onClose();
            }}
            className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded-sm transition-colors text-xs text-slate-400 hover:text-white group"
          >
            <div className="flex items-center gap-3">
               <Monitor className="w-4 h-4 text-electric-blue" />
               <span>Terminal Link</span>
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
          <Lock className="w-3.5 h-3.5 text-electric-blue" />
        </div>
        <div className="text-[9px] text-slate-500 font-light leading-tight">
          Secure Connection Active
        </div>
      </div>
    </div>
  );
}
