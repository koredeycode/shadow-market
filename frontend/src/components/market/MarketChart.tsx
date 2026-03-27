import { useQuery } from '@tanstack/react-query';
import {
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
  Line,
} from 'recharts';
import { marketsApi } from '../../api/markets';
import type { PricePoint } from '@/types';

interface MarketChartProps {
  marketId: string;
  timeRange: '1h' | '24h' | '7d' | '30d' | 'all';
}

export function MarketChart({ marketId, timeRange }: MarketChartProps) {
  const {
    data: priceHistory,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['market-chart', marketId, timeRange],
    queryFn: () => marketsApi.getPriceHistory(marketId, timeRange),
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-electric-blue/30 border-t-electric-blue rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !priceHistory) {
    return (
      <div className="h-[400px] flex items-center justify-center border border-red-500/20 bg-red-500/5 rounded-sm">
        <p className="text-red-400 font-mono text-xs uppercase">Chart Data Unavailable</p>
      </div>
    );
  }

  const chartData = priceHistory.map((point: PricePoint) => ({
    timestamp: new Date(point.timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: timeRange === '1h' || timeRange === '24h' ? '2-digit' : undefined,
      minute: timeRange === '1h' ? '2-digit' : undefined,
    }),
    yes: parseFloat(point.yesPrice) * 100,
    no: parseFloat(point.noPrice) * 100,
  }));

  return (
    <div className="h-[400px] w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorYes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="timestamp" 
            stroke="#475569" 
            fontSize={10} 
            tickLine={false}
            axisLine={false}
            dy={10}
            fontFamily="JetBrains Mono"
          />
          <YAxis
            stroke="#475569"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            tickFormatter={value => `${value}%`}
            fontFamily="JetBrains Mono"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#050505',
              border: '1px solid #1e293b',
              borderRadius: '2px',
              fontFamily: 'JetBrains Mono',
              fontSize: '10px',
            }}
            itemStyle={{ fontSize: '10px' }}
            cursor={{ stroke: '#3b82f6', strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="yes"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorYes)"
            isAnimationActive={true}
          />
          <Line
            type="monotone"
            dataKey="no"
            stroke="#ef4444"
            strokeWidth={1}
            strokeDasharray="4 4"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
