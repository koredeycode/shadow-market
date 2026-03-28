import { Moon, X, Camera, MessageSquare, Music2, Globe, ChevronDown, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    support: [
      { name: 'Learn', path: '/learn' },
      { name: 'X (Twitter)', path: 'https://twitter.com' },
      { name: 'Instagram', path: 'https://instagram.com' },
      { name: 'Discord', path: 'https://discord.com' },
      { name: 'TikTok', path: 'https://tiktok.com' },
      { name: 'News', path: '/news' },
      { name: 'Contact us', path: '/contact' },
      { name: 'Help Center', path: '/help' },
    ],
    brand: [
      { name: 'Rewards', path: '/rewards' },
      { name: 'APIs', path: '/docs/api' },
      { name: 'Leaderboard', path: '/leaderboard' },
      { name: 'Accuracy', path: '/accuracy' },
      { name: 'Brand', path: '/brand' },
      { name: 'Activity', path: '/activity' },
      { name: 'Careers', path: '/careers' },
      { name: 'Press', path: '/press' },
    ],
  };

  return (
    <footer className="bg-obsidian border-t border-white/5 pt-16 pb-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Top Section: Logo & Tagline */}
        <div className="space-y-2">
          <Link to="/" className="flex items-center gap-2 group w-fit">
            <div className="w-8 h-8 bg-electric-blue rounded-sm flex items-center justify-center transition-transform group-hover:scale-105">
              <Moon className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white focus:outline-none">
              Shadow Market
            </span>
          </Link>
          <p className="text-slate-400 text-sm font-light">
            The World's Preeminent Privacy-First Prediction Market&trade;
          </p>
        </div>

        {/* Middle Section: Link Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 pt-4">
          <div className="col-span-2 md:col-span-2 hidden lg:block" />{' '}
          {/* Placeholder for category space if needed later */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">
              Support & Social
            </h4>
            <ul className="space-y-2">
              {footerLinks.support.map(link => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-slate-400 hover:text-white transition-colors font-medium"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">
              Shadow Market
            </h4>
            <ul className="space-y-2">
              {footerLinks.brand.map(link => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-slate-400 hover:text-white transition-colors font-medium"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
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
              <Link to="/integrity" className="hover:text-white transition-colors">
                Market Integrity
              </Link>
              <span className="hidden md:inline opacity-20 text-slate-500">•</span>
              <Link to="/help" className="hover:text-white transition-colors">
                Help Center
              </Link>
              <span className="hidden md:inline opacity-20 text-slate-500">•</span>
              <Link to="/docs" className="hover:text-white transition-colors">
                Docs
              </Link>
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
            Shadow Market operates globally through decentralized smart contracts. Shadow Market US
            is operated by QCX LLC d/b/a Shadow Market US, a CFTC-regulated Designated Contract
            Market. This platform utilizes Midnight ZK-technology for transaction privacy. Trading
            involves substantial risk of loss. Always review our{' '}
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
