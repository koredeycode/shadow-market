import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { betsApi } from '../api/bets';
import { 
  ArrowLeft, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  ShieldCheck,
  Calendar,
  Wallet,
  Zap,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getTxExplorerUrl, isExplorerAvailable } from '../utils/explorer';
import { useContract } from '../hooks/useContract';
import { useWallet } from '../hooks/useWallet';

export default function BetDetails() {
  const { id } = useParams<{ id: string }>();
  const { claimPoolWinnings, isInitialized } = useContract();
  const queryClient = useQueryClient();
  const { isConnected } = useWallet();
  const [isClaiming, setIsClaiming] = useState(false);

  const { data: bet, isLoading, error, refetch } = useQuery({
    queryKey: ['bet', id],
    queryFn: () => betsApi.getBetById(id!),
    enabled: !!id,
  });

  const handleClaim = async () => {
    if (!id || !isInitialized || !isConnected) return;
    
    setIsClaiming(true);
    try {
      // Execute ZK circuit on-chain
      const success = await claimPoolWinnings(id);
      if (success) {
        // Sync with backend reservoir
        await betsApi.claimWinnings(id);
        toast.success('Protocol Winnings Distributed!');
        refetch();
        queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      } else {
          throw new Error('On-chain transaction failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Identity Verification Failed during claim.');
    } finally {
      setIsClaiming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-12 h-12 border-4 border-electric-blue/20 border-t-electric-blue rounded-full animate-spin" />
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">
          Retrieving Bet Details...
        </p>
      </div>
    );
  }

  if (error || !bet) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-red-400 font-bold uppercase tracking-wider mb-2">Bet Not Found</h2>
        <p className="text-slate-500 text-sm mb-6">The requested record could not be retrieved.</p>
        <Link to="/portfolio" className="text-electric-blue hover:underline flex items-center justify-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Portfolio
        </Link>
      </div>
    );
  }

  const isProfitable = parseFloat(bet.profitLoss || '0') >= 0;
  const pnlNum = parseFloat(bet.profitLoss || '0');

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
            <button
              onClick={handleClaim}
              disabled={isClaiming || !isInitialized || bet.marketStatus !== 'RESOLVED' || bet.isSettled}
              className={`flex items-center gap-2 px-4 py-2 rounded-sm text-[11px] font-bold uppercase tracking-widest transition-all ${
                bet.isSettled 
                  ? 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
                  : bet.marketStatus === 'RESOLVED'
                    ? 'bg-success-green text-black hover:brightness-110 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
              }`}
            >
              {isClaiming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : bet.isSettled ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <Zap className={`w-4 h-4 ${bet.marketStatus === 'RESOLVED' ? 'fill-current' : ''}`} />
              )}
              {isClaiming 
                ? 'TRANSMITTING...' 
                : bet.isSettled 
                  ? 'SETTLED' 
                  : bet.marketStatus === 'RESOLVED' 
                    ? 'CLAIM_PAYOUT' 
                    : 'WAITING FOR RESOLUTION'}
            </button>
           <span className={`px-2 py-1 border rounded-sm text-[10px] font-bold uppercase tracking-widest ${
             bet.isSettled ? 'bg-slate-500/10 text-slate-400 border-white/5' : 'bg-success-green/10 text-success-green border-success-green/20'
           }`}>
             {bet.isSettled ? 'SETTLED' : 'ACTIVE'}
           </span>
        </div>
      </div>

      <header className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-3xl font-bold text-white tracking-tight leading-tight">
              {bet.marketQuestion}
            </h1>
            <div className="flex items-center gap-4 text-slate-500 text-[10px] font-mono font-bold uppercase tracking-widest leading-none">
              <Link to={`/markets/${bet.marketSlug}`} className="text-electric-blue hover:underline flex items-center gap-1.5">
                View Market <ExternalLink className="w-3 h-3" />
              </Link>
              <span>•</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Ends {formatDistanceToNow(new Date(bet.marketEndTime), { addSuffix: true })}</span>
              {bet.username && (
                <>
                  <span>•</span>
                  <span className="text-electric-blue font-bold">{bet.username}</span>
                </>
              )}
            </div>
          </div>
          
          <div className="bg-slate-900/40 border-stealth p-6 rounded-sm min-w-[200px] text-right space-y-1">
             <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Current Performance</span>
             <h2 className={`text-4xl font-bold font-mono tracking-tighter ${isProfitable ? 'text-success-green' : 'text-red-500'}`}>
               {isProfitable ? '+' : ''}{pnlNum.toFixed(2)} NIGHT
             </h2>
             <p className={`text-[11px] font-mono font-bold ${isProfitable ? 'text-success-green/60' : 'text-red-500/60'}`}>
                {bet.isSettled ? 'FINAL PAYOUT: ' : 'TOTAL EXPOSURE: '} {bet.payout || bet.currentValue} NIGHT
             </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/40 border-stealth p-6 rounded-sm space-y-4">
          <div className="p-2 bg-white/[0.03] border border-white/5 rounded-sm w-fit text-slate-400">
            <Wallet className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Staked amount</p>
            <h3 className="text-xl font-bold text-white font-mono">{parseFloat(bet.amount).toFixed(2)} NIGHT</h3>
          </div>
        </div>
        <div className="bg-slate-900/40 border-stealth p-6 rounded-sm space-y-4 text-center">
          <div className="p-2 bg-white/[0.03] border border-white/5 rounded-sm w-fit mx-auto text-slate-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Entry price</p>
            <h3 className="text-xl font-bold text-white font-mono">@{(parseFloat(bet.entryPrice) * 100).toFixed(1)}%</h3>
          </div>
        </div>
        <div className="bg-slate-900/40 border-stealth p-6 rounded-sm space-y-4 text-right">
          <div className="p-2 bg-white/[0.03] border border-white/5 rounded-sm w-fit ml-auto text-slate-400">
            {bet.side === 'yes' ? <TrendingUp className="w-4 h-4 text-success-green" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Selected side</p>
            <h3 className={`text-xl font-bold font-mono uppercase ${bet.side === 'yes' ? 'text-success-green' : 'text-red-500'}`}>
              {bet.side}
            </h3>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/40 border-stealth rounded-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 bg-black/40 flex items-center justify-between">
          <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-white">Network Transaction Details</h3>
          <ShieldCheck className="w-4 h-4 text-electric-blue" />
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Transaction Hash</label>
                  {isExplorerAvailable() && bet.txHash && (
                    <a 
                      href={getTxExplorerUrl(bet.txHash)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[9px] text-electric-blue hover:underline flex items-center gap-1"
                    >
                      View Explorer <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
                <div className="p-3 bg-black/20 border border-white/5 rounded-sm font-mono text-[10px] break-all text-slate-300">
                  {bet.txHash || bet.id}
                </div>
              </div>
             <div className="space-y-2">
               <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Wager ID (Internal)</label>
               <div className="p-3 bg-black/20 border border-white/5 rounded-sm font-mono text-[10px] text-slate-300">
                 {bet.id}
               </div>
             </div>
           </div>
           
           <div className="space-y-6">
             <div className="flex items-start gap-4">
                <Calendar className="w-4 h-4 text-slate-600 mt-1" />
                <div className="space-y-1">
                   <p className="text-[10px] font-mono text-slate-500 uppercase">Time</p>
                   <p className="text-xs text-white">{new Date(bet.entryTimestamp).toLocaleString()}</p>
                </div>
             </div>
             <div className="flex items-start gap-4">
                <ShieldCheck className="w-4 h-4 text-slate-600 mt-1" />
                <div className="space-y-1">
                   <p className="text-[10px] font-mono text-slate-500 uppercase">Status</p>
                   <p className="text-xs text-success-green">Confirmed on Midnight</p>
                </div>
             </div>
             {bet.isSettled && (
               <div className="flex items-start gap-4">
                  <Calendar className="w-4 h-4 text-slate-600 mt-1" />
                   <div className="space-y-1">
                     <p className="text-[10px] font-mono text-slate-500 uppercase">Settlement date</p>
                     <p className="text-xs text-white font-bold">{bet.settledAt ? new Date(bet.settledAt).toLocaleString() : new Date().toLocaleString()}</p>
                  </div>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
