import { Construction, Zap, Info, LayoutGrid } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CreateMarket() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="mb-12 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-electric-blue/10 rounded-sm">
            <LayoutGrid className="w-5 h-5 text-electric-blue" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Create Market
          </h1>
        </div>
        <p className="text-slate-400 text-lg font-light leading-relaxed">
          Design and launch your own prediction market on the Shadow Network.
        </p>
      </div>

      <div className="relative group overflow-hidden bg-slate-900/40 border-2 border-dashed border-white/10 rounded-sm min-h-[450px] flex items-center justify-center p-8 backdrop-blur-sm transition-all hover:border-electric-blue/20">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-4 font-mono text-[10px] text-slate-700 opacity-20 uppercase tracking-widest">
          SYSTEM_STATE: PRE_ALPHA_PHASE
        </div>
        
        <div className="max-w-md w-full text-center space-y-8 relative z-10">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-electric-blue/20 blur-2xl rounded-full scale-150 animate-pulse" />
            <div className="relative p-6 bg-slate-950 border border-white/5 rounded-sm">
              <Construction className="w-16 h-16 text-electric-blue" />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight italic uppercase">
              Protocol Expansion Underway
            </h2>
            <div className="space-y-4">
              <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.15em] leading-relaxed">
                The market creation interface is currently undergoing ZK-reconciliation. Next-phase deployment will enable:
              </p>
              <ul className="text-left space-y-3 pt-2">
                {[
                  'Permissionless Market Initialization',
                  'Custom Oracle Consensus Logic',
                  'Liquidity Pool Seeding Interface',
                  'V2 Privacy-Preserving Metadata'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[11px] font-mono text-slate-400 uppercase tracking-widest">
                    <Zap className="w-3.5 h-3.5 text-electric-blue shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row gap-4">
            <Link 
              to="/markets" 
              className="flex-1 px-8 py-3.5 bg-electric-blue text-white rounded-sm font-bold text-[11px] tracking-[0.2em] uppercase hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              Return to Terminal
            </Link>
            <div className="flex-1 px-8 py-3.5 bg-white/5 border border-white/5 text-slate-500 rounded-sm font-bold text-[11px] tracking-[0.2em] uppercase flex items-center justify-center gap-2 cursor-not-allowed">
              <Info className="w-4 h-4" />
              Early Access
            </div>
          </div>
        </div>

        {/* Gloss Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      </div>
      
      <div className="mt-8 text-center">
        <span className="text-[10px] font-mono text-slate-700 uppercase tracking-[0.4em]">
          Shadow Market // Decentralized Prediction Infrastructure
        </span>
      </div>
    </div>
  );
}

export default CreateMarket;
