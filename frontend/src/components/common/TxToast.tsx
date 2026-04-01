import { useState, useEffect } from 'react';
import toast, { Toast } from 'react-hot-toast';
import { Loader2, CheckCircle2, Terminal, ExternalLink } from 'lucide-react';

interface TxToastProps {
  t: Toast;
  txHash: string;
  successMsg: string;
}

export function TxToast({ t, txHash, successMsg }: TxToastProps) {
  const [status, setStatus] = useState<'validating' | 'finalized'>('validating');

  useEffect(() => {
    // If the success toast shows up, we've theoretically already waited for finalization
    // but the toast itself is what we are seeing here.
    // In our contract.service, we show this AFTER waiting.
    setStatus('finalized');
  }, []);

  return (
    <div className={`p-4 min-w-[300px] border border-white/5 bg-slate-900/90 backdrop-blur-md rounded-sm shadow-2xl transition-all duration-500 overflow-hidden relative group`}>
      <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
        <Terminal className="w-3.5 h-3.5 text-electric-blue" />
      </div>

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            status === 'finalized' ? 'bg-success-green/10 text-success-green' : 'bg-electric-blue/10 text-electric-blue'
          }`}>
             {status === 'finalized' ? <CheckCircle2 className="w-5 h-5" /> : <Loader2 className="w-5 h-5 animate-spin" />}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest leading-none mb-1">
              On-Chain Protocol
            </span>
            <span className="text-sm font-bold text-white tracking-tight uppercase">
              {status === 'finalized' ? successMsg : 'Validating Protocol...'}
            </span>
          </div>
        </div>

        {/* Info Area */}
        <div className="bg-black/40 border border-white/5 p-3 rounded-sm space-y-2">
            <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-[0.2em] text-slate-500">
                <span>TX_IDENTIFIER</span>
                {status === 'finalized' && <span className="text-success-green font-bold">[SYNCED]</span>}
            </div>
            
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400 break-all leading-tight bg-white/5 p-1 px-2 rounded-sm select-all">
                    {txHash}
                </span>
            </div>

            <div className="flex justify-between items-center pt-2">
                 <button 
                    onClick={() => {
                        // Copy txHash to clipboard
                        navigator.clipboard.writeText(txHash);
                        toast.success('Hash copied to clipboard', { duration: 2000, position: 'bottom-right' });
                    }}
                    className="text-[9px] font-mono text-electric-blue hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1.5"
                 >
                     COPY_HASH
                 </button>
                 
                 <div className="h-3 w-[1px] bg-white/10" />

                 <button className="text-[9px] font-mono text-slate-500 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1.5">
                     EXPLORER <ExternalLink className="w-2.5 h-2.5" />
                 </button>
            </div>
        </div>

        <button 
           onClick={() => toast.dismiss(t.id)}
           className="w-full py-2 border border-white/5 hover:bg-white/5 text-[9px] font-mono font-bold text-slate-500 uppercase tracking-[0.3em] transition-all"
        >
           TERMINATE_WINDOW
        </button>
      </div>

      {/* Progress side-bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${
        status === 'finalized' ? 'bg-success-green shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-electric-blue animate-pulse'
      }`} />
    </div>
  );
}
