import { Shield, Eye, Lock, Globe, Mail } from 'lucide-react';

export function Privacy() {
  const sections = [
    {
      title: 'Information We Collect',
      content: 'Shadow Market is a privacy-first platform. We do not collect personal identifying information (PII) such as your name, email, or physical address. Our platform interacts solely with your public wallet address and ZK-proofs generated via the Midnight network.',
    },
    {
      title: 'Data Usage',
      content: 'Any data processed is strictly for the purpose of executing decentralized smart contracts and verifying market outcomes. We utilize Midnight ZK-technology to ensure your individual bets and transaction history remain confidential.',
    },
    {
      title: 'Cookies and Tracking',
      content: 'We use minimal cookies for essential platform functionality. We do not utilize third-party tracking scripts or advertising pixels.',
    },
    {
      title: 'Third-Party Services',
      content: 'Our platform interacts with decentralized oracles and the Midnight network. While we prioritize privacy, users are encouraged to review the policies of their respective wallet providers.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 pt-8">
      {/* Header */}
      <div className="space-y-4 border-b border-white/5 pb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-electric-blue/10 border border-electric-blue/20 rounded-full">
          <Shield className="w-4 h-4 text-electric-blue" />
          <span className="text-[10px] font-mono font-bold text-electric-blue uppercase tracking-widest">
            Privacy Policy
          </span>
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight">Privacy Policy</h1>
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">
          Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Intro Icons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-sm flex items-center gap-4">
          <div className="p-3 bg-success-green/10 text-success-green border border-success-green/20 rounded-sm">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-widest font-mono">Anonymous</h4>
            <p className="text-[10px] text-slate-500 uppercase tracking-tight">No Account Required</p>
          </div>
        </div>
        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-sm flex items-center gap-4">
            <div className="p-3 bg-electric-blue/10 text-electric-blue border border-electric-blue/20 rounded-sm">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-widest font-mono">ZK-Private</h4>
              <p className="text-[10px] text-slate-500 uppercase tracking-tight">Zero Knowledge Proofs</p>
            </div>
          </div>
          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-sm flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-sm">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-widest font-mono">Decentralized</h4>
              <p className="text-[10px] text-slate-500 uppercase tracking-tight">Globally Distributed</p>
            </div>
          </div>
      </div>

      {/* Content */}
      <div className="space-y-12">
        {sections.map((section, index) => (
          <section key={index} className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
              <span className="text-electric-blue font-mono text-xs">0{index + 1}</span>
              {section.title}
            </h2>
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-sm shadow-inner group transition-all hover:bg-white/[0.02]">
                <p className="text-slate-400 font-light leading-relaxed">
                {section.content}
                </p>
            </div>
          </section>
        ))}
      </div>

      {/* Footer Contact */}
      <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-slate-600 text-xs font-light max-w-md">
          Shadow Market Operates via the Midnight Protocol. For privacy-related inquiries, please contact our decentralized support team.
        </p>
        <button className="px-6 py-2 bg-white/5 border border-white/10 text-slate-300 rounded-sm text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
            <Mail className="w-3.5 h-3.5" />
            Contact Support
        </button>
      </div>
    </div>
  );
}

export default Privacy;
