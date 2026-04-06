import { X, Camera, MessageSquare, Music2, Globe, ChevronDown, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();


  return (
    <footer className="bg-obsidian border-t border-white/5 pt-16 pb-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Top Section: Logo & Tagline */}
        <div className="space-y-2">
          <Link to="/" className="flex items-center gap-2 group w-fit">
            <img 
              src="/assets/logo.png" 
              alt="Shadow Market" 
              className="w-10 h-10 object-contain transition-transform group-hover:scale-105" 
            />
            <span className="text-xl font-bold tracking-tight text-white focus:outline-none">
              Shadow Market
            </span>
          </Link>
          <p className="text-slate-400 text-sm font-light">
            The World's Preeminent Privacy-First Prediction Market&trade;
          </p>
        </div>

        {/* Bottom Bar: Socials & Legal */}
        <div className="pt-12 border-t border-white/5 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <a href="#" className="text-slate-500 hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-500 hover:text-white transition-colors">
                <Camera className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-500 hover:text-white transition-colors">
                <MessageSquare className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-500 hover:text-white transition-colors">
                <Music2 className="w-5 h-5" />
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-slate-500 font-mono uppercase tracking-wider">
              <span className="text-white font-bold">Shadow Market Inc. &copy; {currentYear}</span>
              <span className="hidden md:inline opacity-20 text-slate-500">•</span>
              <Link to="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <span className="hidden md:inline opacity-20 text-slate-500">•</span>
              <Link to="/terms" className="hover:text-white transition-colors">
                Terms of Use
              </Link>
              <span className="hidden md:inline opacity-20 text-slate-500">•</span>
              <Link to="/how-it-works" className="hover:text-white transition-colors">
                How It Works
              </Link>
              <span className="hidden md:inline opacity-20 text-slate-500">•</span>
              <span className="text-slate-500">
                Built by{' '}
                <a
                  href="https://korecodes.is-a.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-electric-blue hover:underline underline decoration-electric-blue/30"
                >
                  Yusuf Akorede
                </a>
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-sm hover:border-white/20 transition-all cursor-pointer group">
              <Globe className="w-3.5 h-3.5 text-slate-500 group-hover:text-electric-blue" />
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                English
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
            </div>
          </div>

          {/* Legal Disclaimer */}
          <p className="text-[10px] text-slate-600 font-light leading-relaxed max-w-5xl">
            Shadow Market operates globally through decentralized smart contracts. This platform
            utilizes Midnight ZK-technology for transaction privacy. Trading involves substantial
            risk of loss. Always review our{' '}
            <Link to="/terms" className="text-slate-500 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-slate-500 hover:underline">
              Privacy Policy
            </Link>{' '}
            before participating.
          </p>
        </div>
      </div>
    </footer>
  );
}
