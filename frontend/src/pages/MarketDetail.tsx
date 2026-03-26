import { ArrowBack, TrendingDown, TrendingUp } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { marketsApi } from '../api/markets';
import { MarketChart } from '../components/market/MarketChart';
import { MarketStats } from '../components/market/MarketStats';
import { OrderBook } from '../components/market/OrderBook';
import { RecentTrades } from '../components/market/RecentTrades';
import { CreateP2PWagerModal } from '../components/wager/CreateP2PWagerModal';
import { P2PWagersList } from '../components/wager/P2PWagersList';
import { PlaceBetModal } from '../components/wager/PlaceBetModal';

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
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [p2pModalOpen, setP2pModalOpen] = useState(false);

  const {
    data: market,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['market', id],
    queryFn: () => marketsApi.getById(id!),
    enabled: !!id,
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={50} thickness={3.5} />
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Loading market details...
        </Typography>
      </Container>
    );
  }

  if (error || !market) {
    return (
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Alert
          severity="error"
          sx={{
            borderRadius: 3,
            border: '1px solid rgba(239, 68, 68, 0.3)',
            bgcolor: 'rgba(239, 68, 68, 0.1)',
          }}
        >
          Failed to load market details. Please try again.
        </Alert>
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
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/markets')}
        sx={{
          mb: 3,
          fontWeight: 600,
          '&:hover': {
            bgcolor: 'rgba(124, 58, 237, 0.08)',
          },
        }}
      >
        Back to Markets
      </Button>

      {/* Market Header */}
      <Paper
        sx={{
          p: { xs: 3, md: 4 },
          mb: 4,
          background:
            'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(26, 26, 26, 0.8) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Chip
            label={market.category}
            size="medium"
            sx={{
              textTransform: 'capitalize',
              fontWeight: 600,
              bgcolor: 'rgba(124, 58, 237, 0.15)',
              color: 'primary.light',
              borderRadius: 2,
            }}
          />
          <Chip
            label={market.status}
            color={statusColor}
            size="medium"
            sx={{ fontWeight: 600, borderRadius: 2 }}
          />
        </Box>

        <Typography
          variant="h3"
          gutterBottom
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1.75rem', md: '2.25rem' },
            lineHeight: 1.3,
            mb: 2,
          }}
        >
          {market.question}
        </Typography>

        {market.description && (
          <Typography color="text.secondary" sx={{ mb: 4, fontSize: '1.05rem', lineHeight: 1.7 }}>
            {market.description}
          </Typography>
        )}

        {/* Price Display */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                background:
                  'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
                border: '2px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
                  borderColor: 'rgba(16, 185, 129, 0.5)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <TrendingUp sx={{ color: 'success.main', fontSize: 28 }} />
                </Box>
                <Typography variant="h5" fontWeight={700} sx={{ color: 'success.light' }}>
                  YES
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight={800} sx={{ color: 'success.main' }}>
                {(market.yesPrice * 100).toFixed(1)}%
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                background:
                  'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
                border: '2px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)',
                  borderColor: 'rgba(239, 68, 68, 0.5)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(239, 68, 68, 0.2)',
                  }}
                >
                  <TrendingDown sx={{ color: 'error.main', fontSize: 28 }} />
                </Box>
                <Typography variant="h5" fontWeight={700} sx={{ color: 'error.light' }}>
                  NO
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight={800} sx={{ color: 'error.main' }}>
                {(market.noPrice * 100).toFixed(1)}%
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Action Button */}
        {market.status === 'OPEN' && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={() => setBetModalOpen(true)}
                sx={{
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                }}
              >
                Place AMM Bet
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={() => setP2pModalOpen(true)}
                sx={{
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                }}
              >
                Create P2P Wager
              </Button>
            </Grid>
          </Grid>
        )}

        {market.status === 'RESOLVED' && market.outcome !== null && (
          <Alert
            severity="info"
            sx={{
              mt: 2,
              borderRadius: 3,
              border: '1px solid rgba(6, 182, 212, 0.3)',
              bgcolor: 'rgba(6, 182, 212, 0.1)',
              fontSize: '1.05rem',
            }}
          >
            Market resolved: <strong>{market.outcome === 1 ? 'YES' : 'NO'}</strong> wins
          </Alert>
        )}
      </Paper>

      {/* Tabs */}
      <Paper
        sx={{
          mb: 4,
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              fontWeight: 600,
              fontSize: '1rem',
              textTransform: 'none',
              py: 2.5,
              minHeight: 'auto',
            },
            '& .Mui-selected': {
              color: 'primary.main',
            },
          }}
        >
          <Tab label="Overview" />
          <Tab label="Chart" />
          <Tab label="P2P Wagers" />
          <Tab label="Order Book" />
          <Tab label="Recent Trades" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <MarketStats market={market} />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Paper
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
            {(['1h', '24h', '7d', '30d', 'all'] as const).map(range => (
              <Button
                key={range}
                variant={timeRange === range ? 'contained' : 'outlined'}
                size="medium"
                onClick={() => setTimeRange(range)}
                sx={{
                  minWidth: 60,
                  fontWeight: 600,
                }}
              >
                {range.toUpperCase()}
              </Button>
            ))}
          </Box>
          <MarketChart marketId={market.id} timeRange={timeRange} />
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <P2PWagersList marketId={market.id} />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <OrderBook marketId={market.id} />
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <RecentTrades marketId={market.id} />
      </TabPanel>

      {/* Place Bet Modal */}
      <PlaceBetModal open={betModalOpen} onClose={() => setBetModalOpen(false)} market={market} />

      {/* Create P2P Wager Modal */}
      <CreateP2PWagerModal
        open={p2pModalOpen}
        onClose={() => setP2pModalOpen(false)}
        market={market}
      />
    </Container>
  );
}

export default MarketDetail;
