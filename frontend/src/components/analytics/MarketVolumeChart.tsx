import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, TimeRange, MarketVolumePoint } from '../../api/analytics';

interface MarketVolumeChartProps {
  showLegend?: boolean;
  height?: number;
}

export function MarketVolumeChart({ showLegend = true, height = 400 }: MarketVolumeChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  const { data, isLoading, error } = useQuery<MarketVolumePoint[]>({
    queryKey: ['market-volume-chart', timeRange],
    queryFn: () => analyticsApi.getMarketVolumeHistory(timeRange),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
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

  const handleTimeRangeChange = (_: React.MouseEvent<HTMLElement>, newRange: TimeRange | null) => {
    if (newRange) {
      setTimeRange(newRange);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" height={height}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">Failed to load market volume chart</Alert>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">No market volume data available</Alert>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(point => ({
    timestamp: point.timestamp,
    formattedTime: formatDate(point.timestamp),
    Volume: point.volume,
    Trades: point.trades,
    'Active Users': point.uniqueUsers,
  }));

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            Market Volume & Activity
          </Typography>

          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={handleTimeRangeChange}
            size="small"
          >
            <ToggleButton value="1h">1H</ToggleButton>
            <ToggleButton value="24h">24H</ToggleButton>
            <ToggleButton value="7d">7D</ToggleButton>
            <ToggleButton value="30d">30D</ToggleButton>
            <ToggleButton value="all">ALL</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            
            <XAxis
              dataKey="formattedTime"
              stroke="#888"
              style={{ fontSize: '12px' }}
            />
            
            <YAxis
              yAxisId="left"
              stroke="#888"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => formatCurrency(value)}
            />
            
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#888"
              style={{ fontSize: '12px' }}
            />
            
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#fff' }}
              formatter={(value: number, name: string) => {
                if (name === 'Volume') {
                  return [formatCurrency(value), name];
                }
                return [value, name];
              }}
            />
            
            {showLegend && <Legend />}
            
            <Bar
              yAxisId="left"
              dataKey="Volume"
              fill="#7c3aed"
              radius={[8, 8, 0, 0]}
            />
            
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="Trades"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="Active Users"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
