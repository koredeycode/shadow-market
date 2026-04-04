import { Gavel, ShieldCheck, AlertTriangle, Scale, Zap } from 'lucide-react';

export function Terms() {
  const sections = [
    {
      title: 'Agreement to Terms',
      content: 'By accessing or using Shadow Market, you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.',
    },
    {
      title: 'Platform Use',
      content: 'Shadow Market is a decentralized prediction market platform operating on the Midnight network. You are responsible for ensuring your use of the platform complies with the laws of your jurisdiction.',
    },
    {
      title: 'ZK-Proof Integrity',
      content: 'You acknowledge that all transactions are executed via Zero-Knowledge proofs. While your identity remains private, you are solely responsible for the security of your wallet and private keys.',
    },
    {
      title: 'Risk Disclosure',
      content: 'Trading in prediction markets involves significant financial risk. Only wager capital that you are prepared to lose. Shadow Market is not responsible for any financial losses incurred through platform interaction.',
    },
    {
      title: 'Modification of Terms',
      content: 'We reserve the right to revise these terms at any time without notice. By using this platform, you are agreeing to be bound by the then-current version of these Terms of Use.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 pt-8">
      {/* Header */}
      <div className="space-y-4 border-b border-white/5 pb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
          <Gavel className="w-4 h-4 text-amber-500" />
          <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest">
            Terms of Use
          </span>
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight">Terms of Use</h1>
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">
            Effective: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Intro Points */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 bg-white/[0.02] border border-white/5 rounded-sm space-y-4 hover:border-white/10 transition-colors">
            <ShieldCheck className="w-8 h-8 text-electric-blue" />
            <h3 className="text-lg font-bold text-white tracking-tight">User Responsibility</h3>
            <p className="text-slate-400 font-light text-sm leading-relaxed">
            You are responsible for all activity associated with your decentralized wallet address when interacting with our smart contracts.
            </p>
        </div>
        <div className="p-8 bg-white/[0.02] border border-white/5 rounded-sm space-y-4 hover:border-white/10 transition-colors">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
            <h3 className="text-lg font-bold text-white tracking-tight">Risk of Loss</h3>
            <p className="text-slate-400 font-light text-sm leading-relaxed">
            All wagers involve financial risk. Shadow Market does not provide financial advice or guarantee market outcomes.
            </p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-12">
        {sections.map((section, index) => (
          <section key={index} className="space-y-6">
            <div className="flex items-center gap-4">
               <div className="w-8 h-[1px] bg-white/10"></div>
               <h2 className="text-xl font-bold text-white tracking-tight lowercase font-mono">
                 {section.title}
               </h2>
            </div>
            <div className="p-8 bg-black/20 border border-white/5 rounded-sm relative overflow-hidden group hover:bg-black/30 transition-all">
                <div className="absolute top-0 left-0 w-1 h-full bg-electric-blue shadow-[0_0_15px_rgba(59,130,246,0.3)]"></div>
                <p className="text-slate-400 font-light leading-relaxed">
                {section.content}
                </p>
            </div>
          </section>
        ))}
      </div>

      {/* Legal Footer */}
      <div className="pt-12 border-t border-white/5 space-y-8">
         <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-slate-500" />
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Legal Framework</span>
         </div>
         <p className="text-[10px] text-slate-600 font-light leading-relaxed max-w-4xl font-mono uppercase">
            Shadow Market operates as a decentralized software protocol. Interaction with the protocol is done autonomously via smart contract calls. No centralized entity manages funds or guarantees settlement outside of the ZK-circuit logic.
         </p>
         <div className="flex items-center gap-2 text-electric-blue">
            <Zap className="w-4 h-4 animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Protocol Finality Confirmed</span>
         </div>
      </div>
    </div>
  );
}

export default Terms;
