import { Download, ChevronDown, FileJson, Clock } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { analyticsApi, TimeRange } from '../../api/analytics';

interface ExportDataButtonProps {
  type: 'portfolio' | 'market';
  marketId?: string;
}

export function ExportDataButton({ type, marketId }: ExportDataButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async (timeRange?: TimeRange) => {
    setExporting(true);
    setIsOpen(false);

    try {
      let blob: Blob;
      let filename: string;

      if (type === 'portfolio' && timeRange) {
        blob = await analyticsApi.exportPortfolioData(timeRange);
        filename = `shadow-portfolio-${timeRange}-${Date.now()}.csv`;
      } else if (type === 'market' && marketId) {
        blob = await analyticsApi.exportMarketData(marketId);
        filename = `shadow-market-${marketId}-${Date.now()}.csv`;
      } else {
        throw new Error('Invalid export configuration');
      }

      downloadBlob(blob, filename);
      toast.success('Secure data export complete.');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.response?.data?.message || 'Failed to authorize data export');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={type === 'portfolio' ? () => setIsOpen(!isOpen) : () => handleExport()}
        disabled={exporting}
        className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/10 rounded-sm text-slate-300 text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-white/[0.06] hover:text-white transition-all disabled:opacity-50"
      >
        {exporting ? (
          <div className="w-3 h-3 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
        ) : (
          <Download className="w-3 h-3" />
        )}
        <span>{exporting ? 'Exporting...' : 'Export_Data'}</span>
        {type === 'portfolio' && (
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && type === 'portfolio' && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-sm shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
          <div className="p-2 border-b border-white/5 bg-white/[0.02]">
            <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest px-2">
              Select Interval
            </p>
          </div>
          <div className="flex flex-col">
            {[
              { label: 'Last 24 Hours', value: '24h' as TimeRange },
              { label: 'Past 7 Days', value: '7d' as TimeRange },
              { label: 'Past 30 Days', value: '30d' as TimeRange },
              { label: 'Archive_Full', value: 'all' as TimeRange },
            ].map(item => (
              <button
                key={item.value}
                onClick={() => handleExport(item.value)}
                className="flex items-center gap-3 px-4 py-3 text-[10px] font-mono text-slate-400 hover:text-electric-blue hover:bg-electric-blue/5 transition-all text-left"
              >
                {item.value === 'all' ? (
                  <FileJson className="w-3 h-3" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
