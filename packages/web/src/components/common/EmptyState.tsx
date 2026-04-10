import { HelpCircle, ArrowRight, Activity } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  variant?: 'minimal' | 'default' | 'card';
}

export function EmptyState({ 
  title, 
  description, 
  actionLabel, 
  onAction, 
  icon,
  variant = 'default' 
}: EmptyStateProps) {
  if (variant === 'minimal') {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 border border-white/5 bg-white/[0.01] rounded-sm group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="relative text-slate-700 group-hover:text-electric-blue/50 transition-colors duration-500 mb-3">
          {icon || <HelpCircle className="w-8 h-8 opacity-20" />}
        </div>
        <h4 className="relative text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] font-mono text-center">
          {title}
        </h4>
        {description && (
          <p className="relative text-[9px] text-slate-600 font-mono uppercase tracking-widest mt-1 text-center max-w-[200px]">
            {description}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center min-h-[400px] gap-8 p-12 relative overflow-hidden rounded-sm transition-all duration-700
      ${variant === 'card' 
        ? 'bg-slate-900/40 border border-white/10 glass-card' 
        : 'bg-transparent border border-white/5'
      } group`}>
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-electric-blue/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-1000" />
      <div className="absolute -inset-[100%] bg-[conic-gradient(from_0deg,transparent_0,transparent_25%,rgba(59,130,246,0.03)_50%,transparent_75%,transparent_100%)] animate-[spin_10s_linear_infinite] opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative">
        <div className="absolute inset-0 bg-electric-blue/20 blur-2xl rounded-full scale-150 animate-pulse" />
        <div className="relative w-24 h-24 flex items-center justify-center rounded-full border border-white/10 bg-slate-900/80 shadow-2xl group-hover:border-electric-blue/50 group-hover:shadow-electric-blue/20 transition-all duration-500">
          <div className="text-slate-500 group-hover:text-electric-blue transition-colors duration-500">
            {icon || <HelpCircle className="w-10 h-10" />}
          </div>
          
          {/* Orbiting Ring */}
          <div className="absolute inset-0 rounded-full border border-dashed border-electric-blue/30 animate-[spin_20s_linear_infinite] scale-125" />
        </div>
      </div>

      <div className="text-center space-y-4 max-w-md z-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-electric-blue/50" />
          <Activity className="w-3 h-3 text-electric-blue animate-pulse" />
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-electric-blue/50" />
        </div>
        <h3 className="text-lg font-bold text-white uppercase tracking-[0.4em] font-mono leading-none drop-shadow-sm">
          {title}
        </h3>
        {description && (
          <p className="text-[11px] text-slate-400 font-mono uppercase tracking-widest leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
            {description}
          </p>
        )}
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="relative mt-4 px-10 py-4 bg-slate-950/50 border border-white/10 text-slate-400 hover:text-white hover:border-electric-blue/50 hover:bg-electric-blue/10 rounded-sm text-[10px] font-bold uppercase tracking-[0.3em] transition-all flex items-center gap-3 group/btn overflow-hidden"
        >
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-electric-blue scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-500" />
          {actionLabel}
          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
        </button>
      )}

      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
        <div className="px-4 py-1.5 bg-slate-950/80 border border-white/5 rounded-full flex items-center gap-3">
          <div className="flex gap-1">
             {[1,2,3].map(i => (
               <div key={i} className="w-1 h-1 rounded-full bg-electric-blue/30 group-hover:bg-electric-blue transition-colors" style={{ transitionDelay: `${i * 100}ms` }} />
             ))}
          </div>
          <span className="font-mono text-[9px] text-slate-600 uppercase tracking-[0.3em] select-none">
            NULL_DATA_STREAM // STATUS_OFFLINE
          </span>
        </div>
      </div>
    </div>
  );
}

