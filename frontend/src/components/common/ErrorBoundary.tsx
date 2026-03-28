import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-mono selection:bg-electric-blue selection:text-white">
          <div className="max-w-2xl w-full">
            {/* Terminal Header */}
            <div className="bg-slate-900 border border-white/10 p-4 flex items-center justify-between rounded-t-sm">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <span className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">
                  SYSTEM_CRITICAL_FAILURE
                </span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              </div>
            </div>

            {/* Error Content */}
            <div className="bg-black/40 border-x border-b border-white/10 p-8 space-y-8 backdrop-blur-md">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  Oops! Something went wrong
                </h1>
                <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                  The terminal encountered an unexpected execution error. All active processes have
                  been suspended to prevent data corruption.
                </p>
              </div>

              <div className="bg-red-500/5 overflow-hidden border border-red-500/20 rounded-sm">
                <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                    Error_Message
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-sm text-red-200/80 break-words font-mono italic">
                    {this.state.error?.message ||
                      'An unexpected error occurred during state reconciliation.'}
                  </p>
                </div>
              </div>

              {import.meta.env.DEV && this.state.errorInfo && (
                <div className="bg-slate-950 border border-white/5 rounded-sm overflow-hidden">
                  <div className="px-4 py-2 bg-white/5 border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Stack_Trace
                  </div>
                  <pre className="p-4 text-[11px] text-slate-500 overflow-auto max-h-[250px] scrollbar-thin scrollbar-thumb-white/10 leading-relaxed">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={this.handleReset}
                  className="flex-1 px-8 py-3.5 bg-electric-blue text-white rounded-sm font-bold text-xs tracking-[0.2em] uppercase hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] group"
                >
                  <Home className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                  Return Home
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-8 py-3.5 bg-white/5 text-slate-300 border border-white/10 rounded-sm font-bold text-xs tracking-[0.2em] uppercase hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry Execution
                </button>
              </div>
            </div>

            <div className="mt-8 text-center text-[10px] text-slate-600 font-mono uppercase tracking-[0.3em]">
              Shadow Market Infrastructure // {new Date().getFullYear()}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
