import { Assessment, BarChart as BarChartIcon, People, TrendingUp } from '@mui/icons-material';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { analyticsApi, CategoryStats, PlatformStats, TopMarket, TopTrader } from '../api/analytics';
import { MarketVolumeChart } from '../components/analytics/MarketVolumeChart';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'info';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card
      sx={{
        background: theme =>
          `linear-gradient(135deg, ${theme.palette[color].dark} 0%, ${theme.palette[color].main} 100%)`,
        color: 'white',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: theme => `0 12px 40px ${theme.palette[color].dark}80`,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
              {title}
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 2,
              p: 1.5,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export function Analytics() {
  const [activeTab, setActiveTab] = useState(0);

  const { data: platformStats, isLoading: statsLoading } = useQuery<PlatformStats>({
    queryKey: ['platform-stats'],
    queryFn: () => analyticsApi.getPlatformStats(),
    refetchInterval: 30000,
  });

  const { data: topMarkets, isLoading: marketsLoading } = useQuery<TopMarket[]>({
    queryKey: ['top-markets'],
    queryFn: () => analyticsApi.getTopMarkets(10),
    refetchInterval: 30000,
  });

  const { data: topTraders, isLoading: tradersLoading } = useQuery<TopTrader[]>({
    queryKey: ['top-traders'],
    queryFn: () => analyticsApi.getTopTraders(10),
    refetchInterval: 30000,
  });

  const { data: categoryStats, isLoading: categoriesLoading } = useQuery<CategoryStats[]>({
    queryKey: ['category-stats'],
    queryFn: () => analyticsApi.getCategoryStats(),
    refetchInterval: 30000,
  });

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
      {/* Header */}
      <Box mb={5}>
        <Typography
          variant="h3"
          fontWeight={700}
          gutterBottom
          sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}
        >
          Analytics Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
          Platform statistics, market trends, and performance metrics
        </Typography>
      </Box>

      {/* Platform Stats */}
      {statsLoading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : platformStats ? (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Volume"
              value={formatCurrency(platformStats.totalVolume)}
              icon={<TrendingUp />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Markets"
              value={platformStats.totalMarkets.toString()}
              icon={<BarChartIcon />}
              color="secondary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Users"
              value={platformStats.totalUsers.toString()}
              icon={<People />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Value Locked"
              value={formatCurrency(platformStats.totalValueLocked)}
              icon={<Assessment />}
              color="info"
            />
          </Grid>
        </Grid>
      ) : null}

      {/* Charts */}
      <Grid container spacing={3} mb={5}>
        <Grid item xs={12}>
          <MarketVolumeChart height={380} />
        </Grid>
      </Grid>

      {/* Tabs for Additional Analytics */}
      <Card
        sx={{
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.08)' }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                fontSize: '1rem',
                textTransform: 'none',
                py: 2.5,
              },
            }}
          >
            <Tab label="Top Markets" />
            <Tab label="Top Traders" />
            <Tab label="Category Breakdown" />
          </Tabs>
        </Box>

        <CardContent>
          {/* Top Markets Tab */}
          {activeTab === 0 && (
            <Box>
              {marketsLoading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : topMarkets && topMarkets.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Market</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Volume</TableCell>
                        <TableCell align="right">Positions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topMarkets.map((market, index) => (
                        <TableRow key={market.id} hover>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Link
                              to={`/markets/${market.id}`}
                              style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                              <Typography
                                sx={{
                                  '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                                }}
                              >
                                {market.question}
                              </Typography>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Chip label={market.category} size="small" />
                          </TableCell>
                          <TableCell align="right">{formatCurrency(market.volume)}</TableCell>
                          <TableCell align="right">{market.totalPositions}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">No market data available</Alert>
              )}
            </Box>
          )}

          {/* Top Traders Tab */}
          {activeTab === 1 && (
            <Box>
              {tradersLoading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : topTraders && topTraders.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Trader</TableCell>
                        <TableCell align="right">Volume</TableCell>
                        <TableCell align="right">P&L</TableCell>
                        <TableCell align="right">Win Rate</TableCell>
                        <TableCell align="right">Total Bets</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topTraders.map((trader, index) => (
                        <TableRow key={trader.address} hover>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{trader.username || formatAddress(trader.address)}</TableCell>
                          <TableCell align="right">{formatCurrency(trader.totalVolume)}</TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              color: trader.profitLoss >= 0 ? 'success.main' : 'error.main',
                              fontWeight: 'bold',
                            }}
                          >
                            {trader.profitLoss >= 0 ? '+' : ''}
                            {formatCurrency(trader.profitLoss)}
                          </TableCell>
                          <TableCell align="right">{trader.winRate.toFixed(1)}%</TableCell>
                          <TableCell align="right">{trader.totalBets}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">No trader data available</Alert>
              )}
            </Box>
          )}

          {/* Category Breakdown Tab */}
          {activeTab === 2 && (
            <Box>
              {categoriesLoading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : categoryStats && categoryStats.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Total Volume</TableCell>
                        <TableCell align="right">Markets</TableCell>
                        <TableCell align="right">Avg Volume</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {categoryStats.map(cat => (
                        <TableRow key={cat.category} hover>
                          <TableCell>
                            <Chip label={cat.category} color="primary" />
                          </TableCell>
                          <TableCell align="right">{formatCurrency(cat.volume)}</TableCell>
                          <TableCell align="right">{cat.marketCount}</TableCell>
                          <TableCell align="right">{formatCurrency(cat.avgVolume)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">No category data available</Alert>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}

export default Analytics;
