import { HelpCircle, Zap, Shield, Wallet, BarChart3, ArrowRight } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      title: 'Initialize Connection',
      description: 'Connect your Midnight-compatible wallet to access the decentralized prediction network.',
      icon: Wallet,
      color: 'text-electric-blue',
    },
    {
      title: 'Deploy Capital',
      description: 'Select a market and commit NIGHT tokens to a specific outcome. Your privacy is protected via ZK-proofs.',
      icon: Zap,
      color: 'text-amber-accent',
    },
    {
      title: 'Wait for Resolution',
      description: 'Markets are resolved by decentralized oracles once the event timeframe concludes.',
      icon: Shield,
      color: 'text-success-green',
    },
    {
      title: 'Claim Winnings',
      description: 'If your prediction is correct, settle your position and withdraw your tokens instantly.',
      icon: BarChart3,
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-16 pb-20">
      {/* Header */}
      <div className="space-y-4 text-center pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-electric-blue/10 border border-electric-blue/20 rounded-full mb-4">
          <HelpCircle className="w-4 h-4 text-electric-blue" />
          <span className="text-[10px] font-mono font-bold text-electric-blue uppercase tracking-widest">
            Protocol Overview
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
          How Shadow Market Operates
        </h1>
        <p className="text-slate-400 text-lg font-light leading-relaxed max-w-2xl mx-auto">
          A decentralized, privacy-first infrastructure for global prediction markets, powered by Midnight ZK-technology.
        </p>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {steps.map((step, index) => (
          <div key={index} className="group p-8 bg-white/[0.02] border border-white/5 rounded-sm hover:border-white/10 transition-all hover:bg-white/[0.03]">
            <div className="flex items-start gap-6">
              <div className={`p-4 bg-black/40 border border-white/10 rounded-sm group-hover:scale-110 transition-transform ${step.color}`}>
                <step.icon className="w-6 h-6" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-slate-600 font-bold">0{index + 1}</span>
                  <h2 className="text-xl font-bold text-white tracking-tight">{step.title}</h2>
                </div>
                <p className="text-slate-400 font-light leading-relaxed text-sm">
                  {step.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Deep Dive Section */}
      <section className="bg-slate-900/40 border-stealth p-8 md:p-12 space-y-8 rounded-sm">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            The ZK Advantage
          </h2>
          <p className="text-slate-400 font-light leading-relaxed">
            Shadow Market leverages Zero-Knowledge proofs to ensure that while your transactions are verifiable on the public ledger, your specific position, identity, and stake remain completely confidential.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest">Privacy</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-mono">End-to-End Encryption for every wager.</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest">Trustless</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-mono">No central authority controls your funds.</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest">Global</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-mono">Accessible from anywhere, anytime.</p>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5">
          <button className="flex items-center gap-2 text-electric-blue font-bold text-xs uppercase tracking-[0.2em] hover:gap-3 transition-all">
            Explore Markets <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}

export default HowItWorks;
