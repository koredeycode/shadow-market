import { HelpCircle, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 p-8 bg-slate-900/40 border-2 border-dashed border-white/5 rounded-sm backdrop-blur-sm group hover:bg-slate-900/60 transition-all duration-500">
      <div className="relative">
        <div className="absolute inset-0 bg-electric-blue/10 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="relative text-slate-600 group-hover:text-electric-blue transition-colors duration-500">
          {icon || <HelpCircle className="w-16 h-16 opacity-20" />}
        </div>
      </div>
      
      <div className="text-center space-y-2 max-w-sm">
        <h3 className="text-sm font-bold text-white uppercase tracking-[0.3em] font-mono italic">
          {title}
        </h3>
        {description && (
          <p className="text-[11px] text-slate-500 font-mono uppercase tracking-tight leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-8 py-3 bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-electric-blue hover:bg-electric-blue/10 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-2"
        >
          {actionLabel}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}

      <div className="absolute bottom-4 font-mono text-[8px] text-slate-800 uppercase tracking-[0.5em] select-none">
        PROTOCOL_IDLE // 0x0
      </div>
    </div>
  );
}
