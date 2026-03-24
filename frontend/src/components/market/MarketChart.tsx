import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Box, CircularProgress, Alert } from '@mui/material';
import { marketsApi } from '../../api/markets';

interface MarketChartProps {
  marketId: string;
  timeRange: '1h' | '24h' | '7d' | '30d' | 'all';
}

export function MarketChart({ marketId, timeRange }: MarketChartProps) {
  const { data: priceHistory, isLoading, error } = useQuery({
    queryKey: ['market-chart', marketId, timeRange],
    queryFn: () => marketsApi.getPriceHistory(marketId, timeRange),
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !priceHistory) {
    return <Alert severity="error">Failed to load chart data</Alert>;
  }

  const chartData = priceHistory.map((point) => ({
    timestamp: new Date(point.timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: timeRange === '1h' || timeRange === '24h' ? '2-digit' : undefined,
      minute: timeRange === '1h' ? '2-digit' : undefined,
    }),
    YES: (point.yesPrice * 100).toFixed(2),
    NO: (point.noPrice * 100).toFixed(2),
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis
          dataKey="timestamp"
          stroke="#999"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke="#999"
          style={{ fontSize: '12px' }}
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
          }}
          formatter={(value: number) => [`${value}%`, '']}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="YES"
          stroke="#4caf50"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="NO"
          stroke="#f44336"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
