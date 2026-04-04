import { Link } from 'react-router-dom';
import { Home, AlertTriangle, ChevronLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="relative">
        <div className="absolute -inset-8 bg-electric-blue/10 blur-3xl rounded-full" />
        <div className="relative space-y-8 text-center max-w-md w-full">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center rotate-3 animate-pulse">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-8xl font-black text-white/5 font-mono select-none">404</h1>
            <div className="space-y-1 relative -mt-12">
              <h2 className="text-2xl font-bold text-white tracking-tight uppercase">Terminal Error: 404</h2>
              <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">
                Resource not found in the Shadow Protocol
              </p>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-white/5 p-6 rounded-sm space-y-4 text-left">
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              The requested coordinate <span className="font-mono text-electric-blue">{window.location.pathname}</span> has been encrypted or purged from the mainframe. Please verify your clearance levels or return to the base layer.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/"
              className="w-full sm:w-auto px-8 py-3 bg-electric-blue text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Return to Base
            </Link>
            <button
              onClick={() => window.history.back()}
              className="w-full sm:w-auto px-8 py-3 bg-white/5 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border border-white/10 rounded-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
