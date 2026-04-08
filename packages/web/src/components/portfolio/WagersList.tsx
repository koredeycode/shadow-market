import { Link } from 'react-router-dom';
import { ExternalLink, HandMetal } from 'lucide-react';
import type { Wager } from '../../types';

interface WagerRowProps {
  wager: Wager;
}

function WagerRow({ wager }: WagerRowProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'text-amber-500 border-amber-500/20 bg-amber-500/5';
      case 'MATCHED': return 'text-success-green border-success-green/20 bg-success-green/5';
      case 'SETTLED': return 'text-slate-400 border-white/10 bg-white/5';
      case 'CANCELLED': return 'text-red-400 border-red-400/20 bg-red-400/5';
      default: return 'text-slate-500 border-white/5';
    }
  };

  return (
    <div className="group border-b border-white/5 hover:bg-white/[0.02] transition-colors">
      <Link to={`/portfolio/wagers/${wager.id}`} className="block">
        <div className="hidden lg:grid grid-cols-12 gap-4 items-center px-6 py-4">
          <div className="col-span-5 space-y-1">
            <h4 className="text-xs font-bold text-white group-hover:text-electric-blue transition-colors truncate">
              {wager.market?.question || 'P2P Wager Protocol'}
            </h4>
            <div className="flex items-center gap-2">
              <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-sm border ${
                wager.creatorSide === 'yes' 
                  ? 'border-success-green/30 text-success-green bg-success-green/5' 
                  : 'border-red-500/30 text-red-500 bg-red-500/5'
              }`}>
                {wager.creatorSide.toUpperCase()} SIDE
              </span>
              <span className="text-[9px] font-mono text-slate-600 uppercase">
                ODDS: {wager.odds[0]}:{wager.odds[1]}
              </span>
            </div>
          </div>

          <div className="col-span-2 text-center">
            <span className={`px-2 py-0.5 border rounded-sm text-[9px] font-mono font-bold uppercase tracking-widest ${getStatusColor(wager.status)}`}>
               {wager.status}
            </span>
          </div>

          <div className="col-span-3 text-right">
             <p className="text-[11px] font-mono text-white font-bold">
               {wager.amount} <span className="text-[9px] text-slate-500">NIGHT</span>
             </p>
             <p className="text-[9px] font-mono text-slate-500 uppercase">
                Collateral
             </p>
          </div>

          <div className="col-span-2 flex justify-end">
             <div className="p-2 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-4 h-4" />
             </div>
          </div>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden p-4 space-y-3">
           <div className="flex justify-between items-start">
              <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight">
                {wager.market?.question || 'P2P Protocol'}
              </h4>
              <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-sm border ${getStatusColor(wager.status)}`}>
                 {wager.status}
              </span>
           </div>
           <div className="flex justify-between items-end border-t border-white/5 pt-3">
              <div className="space-y-1">
                 <p className="text-[9px] font-mono text-slate-500 uppercase">Stake</p>
                 <p className="text-xs font-mono font-bold text-white">{wager.amount} NIGHT</p>
              </div>
              <div className="text-right space-y-1">
                 <p className="text-[9px] font-mono text-slate-500 uppercase">Odds</p>
                 <p className="text-xs font-mono font-bold text-electric-blue">{wager.odds[0]}:{wager.odds[1]}</p>
              </div>
           </div>
        </div>
      </Link>
    </div>
  );
}

interface WagersListProps {
  wagers: Wager[];
}

export function WagersList({ wagers }: WagersListProps) {
  if (wagers.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-full text-slate-600">
          <HandMetal className="w-8 h-8 opacity-20" />
        </div>
        <div className="space-y-1">
          <h4 className="text-white font-bold text-xs uppercase tracking-widest">No P2P Wagers Portfolio</h4>
          <p className="text-slate-500 text-[10px] font-mono max-w-[200px] leading-relaxed">
            You have not created or matched any peer-to-peer protocols yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[400px]">
      <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 text-[9px] font-mono text-slate-500 uppercase tracking-widest bg-white/[0.01]">
        <div className="col-span-5">Protocol / Market</div>
        <div className="col-span-2 text-center">Status</div>
        <div className="col-span-3 text-right">Commitment</div>
        <div className="col-span-2 text-right">View</div>
      </div>
      <div>
        {wagers.map(wager => (
          <WagerRow key={wager.id} wager={wager} />
        ))}
      </div>
    </div>
  );
}
