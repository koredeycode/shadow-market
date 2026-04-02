import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Hash, 
  Activity, 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Eye,
  ChevronRight,
  Zap,
  Package
} from 'lucide-react';
import { useMidnight } from '../../contexts/MidnightContext';
import { contractManager } from '../../services/contract.service';
import { toast } from 'react-hot-toast';

// Helper to format bytes/hashes
const formatHash = (hash: string | Uint8Array | undefined) => {
  if (!hash) return 'N/A';
  if (typeof hash === 'string') return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  return Buffer.from(hash).toString('hex').slice(0, 24) + '...';
};

const EnumValue: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="flex items-center gap-2">
    <span className={`w-2 h-2 rounded-full bg-${color}`} />
    <span className="text-white font-mono text-xs">{label}</span>
    <span className="text-slate-500 font-mono text-[10px]">({value})</span>
  </div>
);

export function ContractState() {
  const { address: connectedAddress } = useMidnight();
  const { isContractInitialized } = useMidnight();
  const [contractState, setContractState] = useState<any>(null);
  const [lookupId, setLookupId] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'explorer' | 'raw'>('overview');

  const adminAddress = import.meta.env.VITE_ADMIN_ADDRESS;
  const isCorrectWallet = !adminAddress || connectedAddress === adminAddress;

  // Subscribe to contract state
  useEffect(() => {
    const sub = contractManager.subscribeToState((state) => {
      setContractState(state);
    });
    return () => sub?.unsubscribe();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // State updates automatically via subscription, but we can trigger a manual check if needed
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
    toast.success('Ledger state synchronized');
  };

  const handleLookup = () => {
    if (!lookupId || !contractState?.ledger) return;
    
    const id = BigInt(lookupId);
    const ledger = contractState.ledger;

    try {
      // Lookup various maps for the given ID
      const results = {
        market: {
          status: ledger.marketStatus.lookup(id),
          endTime: ledger.marketEndTime.lookup(id),
          outcome: ledger.marketOutcome.lookup(id),
          // title: ledger.marketTitle.lookup(id), // Needs decoding
        },
        wager: {
          status: ledger.wagerStatus.lookup(id),
          amount: ledger.wagerAmount.lookup(id),
          side: ledger.wagerSide.lookup(id),
        }
      };
      setLookupResult(results);
    } catch (e) {
      console.error('Lookup failed:', e);
      setLookupResult(null);
      toast.error('ID not found in ledger maps');
    }
  };

  const handleInitialize = async () => {
    try {
      await contractManager.executeContractInitialize();
    } catch (e: any) {
      console.error('Initialization failed:', e);
    }
  };

  if (!isCorrectWallet) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-6" />
        <h1 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight">Access Restricted</h1>
        <p className="text-slate-500 text-xs font-mono uppercase tracking-widest">Authorized admin wallet connection required</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-sm border border-indigo-500/20 flex items-center justify-center">
            <Terminal className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Contract State Explorer</h1>
            <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mt-1">Live on-chain ledger terminal</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-white/5 rounded-sm transition-colors text-slate-400"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-sm">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Network:</span>
            <span className="text-[10px] font-mono text-indigo-400 uppercase ml-2">Midnight-Testnet</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 text-[10px] font-mono uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-400/5' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('explorer')}
          className={`px-6 py-3 text-[10px] font-mono uppercase tracking-widest transition-all ${activeTab === 'explorer' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-400/5' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Map Explorer
        </button>
        <button 
          onClick={() => setActiveTab('raw')}
          className={`px-6 py-3 text-[10px] font-mono uppercase tracking-widest transition-all ${activeTab === 'raw' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-400/5' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Raw JSON
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Metadata Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-shine p-6 rounded-sm border border-white/5">
              <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Contract Metadata
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-black/20 border border-white/5 rounded-sm">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Contract Address</span>
                  <span className="text-xs font-mono text-white">{contractManager.getContractAddress() || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-black/20 border border-white/5 rounded-sm">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Admin Key (Hash)</span>
                  <span className="text-xs font-mono text-white">{formatHash(contractState?.ledger?.adminKey)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-black/20 border border-white/5 rounded-sm">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Initialization State</span>
                  <div className="flex items-center gap-2">
                    {isContractInitialized ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-success-green" />
                        <span className="text-xs font-mono text-success-green uppercase">Initialized</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-red-500 underline" />
                        <span className="text-xs font-mono text-red-500 uppercase underline cursor-pointer" onClick={handleInitialize}>Pending Initialization (Click to Fix)</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase">marketCount</span>
                  <Package className="w-4 h-4 text-indigo-500/50" />
                </div>
                <div className="text-3xl font-bold font-mono text-white">{contractState?.marketCount?.toString() || '0'}</div>
              </div>
              <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase">wagerCount</span>
                  <Activity className="w-4 h-4 text-indigo-500/50" />
                </div>
                <div className="text-3xl font-bold font-mono text-white">{contractState?.wagerCount?.toString() || '0'}</div>
              </div>
              <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase">betIdCounter</span>
                  <Zap className="w-4 h-4 text-indigo-500/50" />
                </div>
                <div className="text-3xl font-bold font-mono text-white">{contractState?.poolBetIdCounter?.toString() || '0'}</div>
              </div>
            </div>
          </div>

          {/* Enum Reference */}
          <div className="glass-shine p-6 rounded-sm border border-white/5 space-y-6">
            <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Enum Definitions
            </h3>
            
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase mb-3 px-2 border-l border-indigo-500">MarketStatus</p>
                <div className="space-y-2 pl-2">
                  <EnumValue label="OPEN" value={0} color="success-green" />
                  <EnumValue label="LOCKED" value={1} color="amber-accent" />
                  <EnumValue label="RESOLVED" value={2} color="indigo-400" />
                </div>
              </div>

              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase mb-3 px-2 border-l border-indigo-500">WagerStatus</p>
                <div className="space-y-2 pl-2">
                  <EnumValue label="OPEN" value={0} color="success-green" />
                  <EnumValue label="MATCHED" value={1} color="indigo-400" />
                  <EnumValue label="CANCELLED" value={2} color="red-500" />
                  <EnumValue label="SETTLED" value={3} color="slate-500" />
                </div>
              </div>

              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase mb-3 px-2 border-l border-indigo-500">Outcome</p>
                <div className="space-y-2 pl-2">
                  <EnumValue label="NONE" value={0} color="slate-700" />
                  <EnumValue label="NO" value={1} color="red-500/50" />
                  <EnumValue label="YES" value={2} color="success-green/50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'explorer' && (
        <div className="space-y-6">
          <div className="p-6 glass-shine rounded-sm border border-white/5 bg-white/[0.01]">
            <div className="max-w-2xl mx-auto space-y-4">
              <h3 className="text-center text-xs font-mono text-slate-500 uppercase tracking-[0.3em] mb-6">Ledger Lookup Identity</h3>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Hash className="w-4 h-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                </div>
                <input 
                  type="number"
                  value={lookupId}
                  onChange={(e) => setLookupId(e.target.value)}
                  placeholder="Enter ID (MarketID, WagerID, or BetID)"
                  className="w-full bg-black/40 border border-white/5 rounded-sm pl-12 pr-24 py-4 text-white font-mono text-sm focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700"
                />
                <button 
                  onClick={handleLookup}
                  className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-500 text-white rounded-[1px] font-mono text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
                >
                  Lookup
                </button>
              </div>
            </div>
          </div>

          {lookupResult ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-300">
              {/* Market Mapping Results */}
              <div className="glass-shine p-6 rounded-sm border border-white/5">
                <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 text-indigo-400" />
                  Market Map Context
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 border border-white/5 rounded-sm bg-white/[0.01]">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Status</span>
                    <span className="text-xs font-mono text-white">{lookupResult.market.status?.toString() || 'NULL'}</span>
                  </div>
                  <div className="flex justify-between p-3 border border-white/5 rounded-sm bg-white/[0.01]">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">End Time</span>
                    <span className="text-xs font-mono text-white">{lookupResult.market.endTime?.toString() || 'NULL'}</span>
                  </div>
                  <div className="flex justify-between p-3 border border-white/5 rounded-sm bg-white/[0.01]">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Outcome</span>
                    <span className="text-xs font-mono text-white">{lookupResult.market.outcome?.toString() || 'NULL'}</span>
                  </div>
                </div>
              </div>

              {/* Wager Mapping Results */}
              <div className="glass-shine p-6 rounded-sm border border-white/5">
                <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 text-indigo-400" />
                  Wager Map Context
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 border border-white/5 rounded-sm bg-white/[0.01]">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Status</span>
                    <span className="text-xs font-mono text-white">{lookupResult.wager.status?.toString() || 'NULL'}</span>
                  </div>
                  <div className="flex justify-between p-3 border border-white/5 rounded-sm bg-white/[0.01]">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Creator Side</span>
                    <span className="text-xs font-mono text-white">{lookupResult.wager.side?.toString() || 'NULL'}</span>
                  </div>
                  <div className="flex justify-between p-3 border border-white/5 rounded-sm bg-white/[0.01]">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Locked Amount</span>
                    <span className="text-xs font-mono text-indigo-400 underline">{lookupResult.wager.amount?.toString() || '0'} NIGHT</span>
                  </div>
                </div>
              </div>
            </div>
          ) : lookupId && (
            <div className="p-12 text-center border border-dashed border-white/5 rounded-sm">
              <p className="text-xs font-mono text-slate-600 uppercase tracking-[0.2em]">Initiate lookup to populate identity context</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'raw' && (
        <div className="p-6 bg-black border border-white/5 rounded-sm overflow-hidden min-h-[400px]">
          <pre className="text-[10px] font-mono text-indigo-400/80 leading-relaxed overflow-x-auto h-[500px] scrollbar-thin">
            {JSON.stringify(contractState || { status: 'Disconnected' }, (_, value) => 
               typeof value === 'bigint' ? value.toString() : value, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default ContractState;
