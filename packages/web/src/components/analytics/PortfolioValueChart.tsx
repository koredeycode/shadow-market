import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Loader2, AlertCircle, Info, Wallet } from 'lucide-react';
import { analyticsApi, PortfolioValuePoint, TimeRange } from '../../api/analytics';

interface PortfolioValueChartProps {
  showLegend?: boolean;
  height?: number;
}

export function PortfolioValueChart({ showLegend = true, height = 400 }: PortfolioValueChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  const { data, isLoading, error } = useQuery<PortfolioValuePoint[]>({
    queryKey: ['portfolio-value-chart', timeRange],
    queryFn: () => analyticsApi.getPortfolioValueHistory(timeRange),
    refetchInterval: 30000,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    if (timeRange === '1h' || timeRange === '24h') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (timeRange === '7d') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (isLoading) {
    return (
      <div
        className="bg-slate-900/40 border border-white/10 rounded-sm p-6 flex flex-col items-center justify-center"
        style={{ height }}
      >
        <Loader2 className="w-8 h-8 text-electric-blue animate-spin" />
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-4">
          Synching Asset History...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-500/5 border border-red-500/20 rounded-sm p-6 flex flex-col items-center justify-center gap-4"
        style={{ height }}
      >
        <AlertCircle className="w-8 h-8 text-red-500" />
        <p className="text-xs font-mono text-red-400 uppercase tracking-widest text-center">
          Protocol Error: Asset History Inaccessible.
        </p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        className="bg-white/2 border border-white/5 rounded-sm p-6 flex flex-col items-center justify-center gap-4"
        style={{ height }}
      >
        <Info className="w-8 h-8 text-slate-500" />
        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">
          No Portfolio Records Detected.
        </p>
      </div>
    );
  }

  const chartData = data.map(point => ({
    timestamp: point.timestamp,
    formattedTime: formatDate(point.timestamp),
    'Total Value': point.totalValue,
    'P&L': point.profitLoss,
  }));

  const ranges: TimeRange[] = ['1h', '24h', '7d', '30d', 'all'];

  return (
    <div className="bg-slate-900/40 border border-white/10 rounded-sm p-6 space-y-6 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Wallet className="w-5 h-5 text-electric-blue" />
          <h3 className="text-sm font-bold text-white tracking-[0.2em] uppercase">
            Portfolio Performance Trace
          </h3>
        </div>

        <div className="flex bg-black/40 border border-white/5 p-1 rounded-sm overflow-hidden">
          {ranges.map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-[10px] font-mono font-bold uppercase transition-all ${
                timeRange === range
                  ? 'bg-electric-blue text-white rounded-sm shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />

            <XAxis
              dataKey="formattedTime"
              stroke="#ffffff1a"
              tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />

            <YAxis
              stroke="#ffffff1a"
              tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={value => formatCurrency(value)}
            />

            <Tooltip
              cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '5 5' }}
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #ffffff1a',
                borderRadius: '2px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
              }}
              itemStyle={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}
              labelStyle={{
                color: '#64748b',
                fontSize: '10px',
                marginBottom: '8px',
                fontWeight: 700,
              }}
              formatter={(value: number) => [formatCurrency(value), 'Value']}
            />

            {showLegend && (
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{
                  paddingBottom: '20px',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="Total Value"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorValue)"
              strokeWidth={2}
            />

            <Area
              type="monotone"
              dataKey="P&L"
              stroke="#06b6d4"
              fillOpacity={1}
              fill="url(#colorPnL)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
