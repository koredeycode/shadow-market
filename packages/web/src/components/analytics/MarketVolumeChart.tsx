import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Loader2, AlertCircle, Info, BarChart3 } from 'lucide-react';
import { analyticsApi, MarketVolumePoint, TimeRange } from '../../api/analytics';

interface MarketVolumeChartProps {
  showLegend?: boolean;
  height?: number;
}

export function MarketVolumeChart({ showLegend = true, height = 400 }: MarketVolumeChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  const { data, isLoading, error } = useQuery<MarketVolumePoint[]>({
    queryKey: ['market-volume-chart', timeRange],
    queryFn: () => analyticsApi.getMarketVolumeHistory(timeRange),
    refetchInterval: 30000,
  });

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value}`;
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
          Analyzing Data Stream...
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
          Execution Error: Chart Data Inaccessible.
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
          No Activity Records Detected.
        </p>
      </div>
    );
  }

  const chartData = data.map(point => ({
    timestamp: point.timestamp,
    formattedTime: formatDate(point.timestamp),
    Volume: point.volume,
    Trades: point.trades,
    'Active Users': point.uniqueUsers,
  }));

  const ranges: TimeRange[] = ['1h', '24h', '7d', '30d', 'all'];

  return (
    <div className="bg-slate-900/40 border border-white/10 rounded-sm p-6 space-y-6 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-electric-blue" />
          <h3 className="text-sm font-bold text-white tracking-[0.2em] uppercase">
            Market Activity Analytics
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
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              yAxisId="left"
              stroke="#ffffff1a"
              tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={value => formatCurrency(value)}
            />

            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#ffffff1a"
              tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              cursor={{ fill: '#ffffff05' }}
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
              formatter={(value: number, name: string) => {
                if (name === 'Volume') return [formatCurrency(value), name];
                return [value, name];
              }}
            />

            {showLegend && (
              <Legend
                verticalAlign="top"
                align="right"
                iconType="rect"
                wrapperStyle={{
                  paddingBottom: '20px',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              />
            )}

            <Bar
              yAxisId="left"
              dataKey="Volume"
              fill="#3b82f6"
              fillOpacity={0.8}
              radius={[2, 2, 0, 0]}
            />

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="Trades"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: '#06b6d4', strokeWidth: 2, fill: '#0f172a' }}
            />

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="Active Users"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: '#10b981', strokeWidth: 2, fill: '#0f172a' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
