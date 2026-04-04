import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, ExternalLink } from 'lucide-react';

interface TxToastProps {
  successMsg: string;
}

export function TxToast({ successMsg }: TxToastProps) {
  const [status, setStatus] = useState<'validating' | 'finalized'>('validating');

  useEffect(() => {
    setStatus('finalized');
  }, []);

  return (
    <div className={`p-3 min-w-[260px] border border-white/5 bg-slate-900/95 backdrop-blur-md rounded-sm shadow-2xl transition-all duration-500 overflow-hidden relative group`}>
      <div className="flex items-center justify-between gap-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
            status === 'finalized' ? 'bg-success-green/10 text-success-green' : 'bg-electric-blue/10 text-electric-blue'
          }`}>
             {status === 'finalized' ? <CheckCircle2 className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest leading-none mb-1">
              On-Chain Protocol
            </span>
            <span className="text-xs font-bold text-white tracking-tight uppercase">
              {status === 'finalized' ? successMsg : 'Validating Protocol...'}
            </span>
          </div>
        </div>

        {/* Action link */}
        {status === 'finalized' && (
          <button className="text-[9px] font-mono text-slate-500 hover:text-electric-blue transition-colors uppercase tracking-widest flex items-center gap-1.5 ml-4 whitespace-nowrap">
            EXPLORER <ExternalLink className="w-2.5 h-2.5" />
          </button>
        )}
      </div>

      {/* Progress side-bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${
        status === 'finalized' ? 'bg-success-green shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-electric-blue animate-pulse'
      }`} />
    </div>
  );
}
