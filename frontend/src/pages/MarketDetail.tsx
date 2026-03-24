import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Typography,
  Box,
  Chip,
  Grid,
  Paper,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { ArrowBack, TrendingUp, TrendingDown } from '@mui/icons-material';
import { useState } from 'react';
import { marketsApi } from '../api/markets';
import { MarketChart } from '../components/market/MarketChart';
import { MarketStats } from '../components/market/MarketStats';
import { OrderBook } from '../components/market/OrderBook';
import { RecentTrades } from '../components/market/RecentTrades';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export function MarketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d' | 'all'>('24h');

  const { data: market, isLoading, error } = useQuery({
    queryKey: ['market', id],
    queryFn: () => marketsApi.getById(id!),
    enabled: !!id,
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !market) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Alert severity="error">Failed to load market details</Alert>
      </Container>
    );
  }

  const statusColor = {
    OPEN: 'success',
    RESOLVED: 'default',
    LOCKED: 'warning',
    CANCELLED: 'error',
  }[market.status] as 'success' | 'default' | 'warning' | 'error';

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/markets')}
        sx={{ mb: 2 }}
      >
        Back to Markets
      </Button>

      {/* Market Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Chip label={market.category} size="small" sx={{ textTransform: 'capitalize' }} />
          <Chip label={market.status} color={statusColor} size="small" />
        </Box>

        <Typography variant="h4" gutterBottom>
          {market.question}
        </Typography>

        {market.description && (
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {market.description}
          </Typography>
        )}

        {/* Price Display */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'success.dark',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp />
                <Typography variant="h6">YES</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {(market.yesPrice * 100).toFixed(1)}%
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'error.dark',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingDown />
                <Typography variant="h6">NO</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {(market.noPrice * 100).toFixed(1)}%
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Action Button */}
        {market.status === 'OPEN' && (
          <Button variant="contained" fullWidth size="large">
            Place Bet
          </Button>
        )}

        {market.status === 'RESOLVED' && market.outcome !== null && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Market resolved: {market.outcome === 1 ? 'YES' : 'NO'} wins
          </Alert>
        )}
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Overview" />
          <Tab label="Chart" />
          <Tab label="Order Book" />
          <Tab label="Recent Trades" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <MarketStats market={market} />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            {(['1h', '24h', '7d', '30d', 'all'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </Box>
          <MarketChart marketId={market.id} timeRange={timeRange} />
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <OrderBook marketId={market.id} />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <RecentTrades marketId={market.id} />
      </TabPanel>
    </Container>
  );
}
