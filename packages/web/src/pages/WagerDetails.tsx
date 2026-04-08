import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { betsApi } from '../api/bets';
import { wagersApi } from '../api/wagers';
import { 
  ArrowLeft, 
  ExternalLink, 
  Clock, 
  ShieldCheck,
  Calendar,
  Wallet,
  Zap,
  Loader2,
  Users,
  AlertTriangle,
  XCircle,
  HandMetal
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
// import { getTxExplorerUrl, isExplorerAvailable } from '../utils/explorer';
import { useContract } from '../hooks/useContract';
import { useWallet } from '../hooks/useWallet';
import type { Wager } from '../types';

export default function WagerDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cancelWager, acceptWager, claimWagerWinnings, isInitialized } = useContract();
  const queryClient = useQueryClient();
  const { isConnected, address } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: wager, isLoading, error, refetch } = useQuery<Wager>({
    queryKey: ['wager', id],
    queryFn: () => betsApi.getWagerById(id!),
    enabled: !!id,
  });

  const isCreator = wager?.creator?.address?.toLowerCase() === address?.toLowerCase();
  // const isTaker = wager?.takerId && !isCreator; // Simplified for this view

  const handleCancel = async () => {
    if (!id || !isInitialized || !isConnected) return;
    setIsProcessing(true);
    try {
      const success = await cancelWager(wager?.onchainId || id);
      if (success) {
        await wagersApi.cancelWager(id);
        toast.success('Wager offer withdrawn');
        navigate('/portfolio');
      }
    } catch (err: any) {
      toast.error(err.message || 'Cancellation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAccept = async () => {
    if (!id || !isInitialized || !isConnected) return;
    setIsProcessing(true);
    try {
      const txHash = await acceptWager(wager?.onchainId || id);
      if (txHash) {
        await wagersApi.acceptWager(wager?.marketId || '', id, { txHash });
        toast.success('Wager matched successfully!');
        refetch();
      }
    } catch (err: any) {
      toast.error(err.message || 'Acceptance failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClaim = async () => {
    if (!id || !isInitialized || !isConnected) return;
    setIsProcessing(true);
    try {
       const success = await claimWagerWinnings(wager?.onchainId || id);
       if (success) {
         await wagersApi.claimWagerWinnings(id);
         toast.success('P2P Protocol Payout Distributed!');
         refetch();
         queryClient.invalidateQueries({ queryKey: ['portfolio'] });
       }
    } catch (err: any) {
      toast.error(err.message || 'Claim failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-12 h-12 border-4 border-electric-blue/20 border-t-electric-blue rounded-full animate-spin" />
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">
          Retrieving Wager Protocol...
        </p>
      </div>
    );
  }

  if (error || !wager) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-red-400 font-bold uppercase tracking-wider mb-2">Wager Not Found</h2>
        <p className="text-slate-500 text-sm mb-6">The requested protocol details could not be retrieved.</p>
        <Link to="/portfolio" className="text-electric-blue hover:underline flex items-center justify-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Portfolio
        </Link>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'text-success-green border-success-green/20 bg-success-green/5';
      case 'MATCHED': return 'text-electric-blue border-electric-blue/20 bg-electric-blue/5';
      case 'SETTLED': return 'text-slate-400 border-white/10 bg-white/5';
      case 'CANCELLED': return 'text-red-400 border-red-400/20 bg-red-400/5';
      default: return 'text-slate-500 border-white/5';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <Link 
          to="/portfolio" 
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-mono uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
           {/* Actions */}
           {isCreator && wager.status !== 'SETTLED' && wager.status !== 'MATCHED' && (
              <button
                onClick={handleCancel}
                disabled={isProcessing || !isInitialized || wager.status !== 'OPEN'}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-400/20 rounded-sm text-[11px] font-bold uppercase tracking-widest hover:bg-red-500/20 disabled:opacity-50 disabled:bg-slate-900/40 disabled:text-slate-500 transition-all font-mono"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                {wager.status === 'OPEN' ? 'Withdraw Offer' : 'WITHDRAWAL UNAVAILABLE'}
              </button>
           )}

           {!isCreator && wager.status === 'OPEN' && (
              <button
                onClick={handleAccept}
                disabled={isProcessing || !isInitialized}
                className="flex items-center gap-2 px-4 py-2 bg-electric-blue text-white rounded-sm text-[11px] font-bold uppercase tracking-widest hover:brightness-110 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <HandMetal className="w-4 h-4" />}
                Match Offer
              </button>
           )}

           {wager.status === 'MATCHED' && (
              <button
                onClick={handleClaim}
                disabled={isProcessing || !isInitialized || wager.market?.status !== 'RESOLVED'}
                className="flex items-center gap-2 px-4 py-2 bg-success-green text-black rounded-sm text-[11px] font-bold uppercase tracking-widest hover:brightness-110 disabled:bg-slate-900/40 disabled:text-slate-500 disabled:border-white/10 disabled:opacity-60 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                {wager.market?.status === 'RESOLVED' ? 'Claim Payout' : 'WAITING FOR RESOLUTION'}
              </button>
           )}

           {wager.status === 'SETTLED' && (
              <button
                disabled
                className="flex items-center gap-2 px-4 py-2 bg-white/5 text-slate-500 border border-white/10 rounded-sm text-[11px] font-bold uppercase tracking-widest cursor-not-allowed transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                SETTLED_PAYOUT
              </button>
           )}

           <span className={`px-2 py-1 border rounded-sm text-[10px] font-bold uppercase tracking-widest ${getStatusColor(wager.status)}`}>
             {wager.status}
           </span>
        </div>
      </div>

      <header className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-3xl font-bold text-white tracking-tight leading-tight">
              {wager.market?.question || 'P2P Wager Protocol'}
            </h1>
            <div className="flex items-center gap-4 text-slate-500 text-[10px] font-mono font-bold uppercase tracking-widest leading-none">
              {wager.market?.slug && (
                <>
                  <Link to={`/markets/${wager.market.slug}`} className="text-electric-blue hover:underline flex items-center gap-1.5">
                    View Market <ExternalLink className="w-3 h-3" />
                  </Link>
                  <span>•</span>
                </>
              )}
              <span className="flex items-center gap-1.5"><Users className="w-3 h-3" /> P2P Settlement</span>
              <span>•</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Expires {formatDistanceToNow(new Date(wager.expiresAt), { addSuffix: true })}</span>
            </div>
          </div>
          
          <div className="bg-slate-900/40 border-stealth p-6 rounded-sm min-w-[200px] text-right space-y-1">
             <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Protocol Staked</span>
             <h2 className="text-4xl font-bold font-mono tracking-tighter text-white">
               {wager.amount} NIGHT
             </h2>
             <p className="text-[11px] font-mono font-bold text-slate-500">
                ODDS: {wager.odds[0]}:{wager.odds[1]}
             </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="bg-slate-900/40 border-stealth p-6 rounded-sm space-y-4">
            <div className="flex items-center justify-between">
               <div className="p-2 bg-white/[0.03] border border-white/5 rounded-sm text-slate-400">
                  <Wallet className="w-4 h-4" />
               </div>
               <span className="text-[10px] font-mono text-slate-500 uppercase">Provider (Creator)</span>
            </div>
            <div className="space-y-1">
               <p className="text-xs font-mono text-slate-300 truncate">{wager.creator?.address || wager.creatorId}</p>
               <h3 className="text-lg font-bold text-white font-mono uppercase">{wager.creatorSide} SIDE</h3>
            </div>
         </div>

         <div className="bg-slate-900/40 border-stealth p-6 rounded-sm space-y-4">
            <div className="flex items-center justify-between">
               <div className="p-2 bg-white/[0.03] border border-white/5 rounded-sm text-slate-400">
                  <HandMetal className="w-4 h-4" />
               </div>
               <span className="text-[10px] font-mono text-slate-500 uppercase">Taker (Match)</span>
            </div>
            <div className="space-y-1">
               <p className="text-xs font-mono text-slate-300 truncate">{wager.takerId ? (wager as any).taker?.address || wager.takerId : 'WAITING FOR COUNTERPARTY...'}</p>
               <h3 className="text-lg font-bold text-white font-mono uppercase">
                  {wager.creatorSide === 'yes' ? 'NO' : 'YES'} SIDE
               </h3>
            </div>
         </div>
      </div>

      <div className="bg-slate-900/40 border-stealth rounded-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 bg-black/40 flex items-center justify-between">
          <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-white">Security & Audit Trail</h3>
          <ShieldCheck className="w-4 h-4 text-electric-blue" />
        </div>
        <div className="p-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Protocol ID</label>
                    <div className="p-3 bg-black/20 border border-white/5 rounded-sm font-mono text-[10px] text-slate-300 break-all">
                       {wager.onchainId || wager.id}
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Creation Hash</label>
                    <div className="p-3 bg-black/20 border border-white/5 rounded-sm font-mono text-[10px] text-slate-300 break-all">
                       {(wager as any).txHash || 'INTERNAL_LEGACY'}
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <div className="space-y-0.5">
                       <p className="text-[10px] font-mono text-slate-500 uppercase">Settlement Rule</p>
                       <p className="text-xs text-slate-300 font-bold">Independent contract resolution via Midnight Protocol.</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-success-green" />
                    <div className="space-y-0.5">
                       <p className="text-[10px] font-mono text-slate-500 uppercase">Privacy Status</p>
                       <p className="text-xs text-success-green font-bold">Encrypted witness proofs active.</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3 text-slate-500">
                    <Calendar className="w-4 h-4" />
                    <div className="space-y-0.5">
                       <p className="text-[10px] font-mono text-slate-500 uppercase">Created</p>
                       <p className="text-xs font-mono">{new Date(wager.createdAt).toLocaleString()}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
