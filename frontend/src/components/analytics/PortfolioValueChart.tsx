import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
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
    refetchInterval: 30000, // Refetch every 30 seconds
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
          <Alert severity="error">Failed to load portfolio value chart</Alert>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">No portfolio data available</Alert>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(point => ({
    timestamp: point.timestamp,
    formattedTime: formatDate(point.timestamp),
    'Total Value': point.totalValue,
    'P&L': point.profitLoss,
  }));

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            Portfolio Value Over Time
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
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#333" />

            <XAxis dataKey="formattedTime" stroke="#888" style={{ fontSize: '12px' }} />

            <YAxis
              stroke="#888"
              style={{ fontSize: '12px' }}
              tickFormatter={value => formatCurrency(value)}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#fff' }}
              formatter={(value: number) => formatCurrency(value)}
            />

            {showLegend && <Legend />}

            <Area
              type="monotone"
              dataKey="Total Value"
              stroke="#7c3aed"
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
      </CardContent>
    </Card>
  );
}
