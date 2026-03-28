import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  size?: number;
}

export function LoadingState({ message = 'Loading...', size = 40 }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-6 p-8 w-full group">
      <div className="relative">
        {/* Decorative backdrop glow */}
        <div className="absolute inset-0 bg-electric-blue/20 blur-2xl rounded-full scale-110 animate-pulse" />

        <div className="relative">
          <Loader2
            className="text-electric-blue animate-spin transition-all duration-700"
            style={{ width: size, height: size }}
            strokeWidth={1.5}
          />
        </div>
      </div>

      <div className="space-y-2 text-center">
        <p className="text-[10px] font-mono font-bold text-electric-blue uppercase tracking-[0.4em] animate-pulse">
          {message}
        </p>
        <div className="flex justify-center gap-1">
          <div className="w-1 h-1 bg-electric-blue/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1 h-1 bg-electric-blue/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1 h-1 bg-electric-blue/40 rounded-full animate-bounce" />
        </div>
      </div>

      <div className="absolute bottom-0 opacity-10 pointer-events-none select-none">
        <span className="text-[6px] font-mono text-slate-500 uppercase tracking-[0.8em]">
          ESTABLISHING_ZK_TUNNEL...
        </span>
      </div>
    </div>
  );
}
