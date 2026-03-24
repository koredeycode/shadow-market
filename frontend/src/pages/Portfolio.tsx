import {
  AccountBalance,
  EmojiEvents,
  LocalAtm,
  ShowChart,
  TrendingDown,
  TrendingUp,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Portfolio as PortfolioData, positionsApi } from '../api/positions';
import { ExportDataButton } from '../components/analytics/ExportDataButton';
import { PortfolioValueChart } from '../components/analytics/PortfolioValueChart';
import { PositionsList } from '../components/portfolio/PositionsList';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  color: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
}

function StatCard({ title, value, icon, trend, color }: StatCardProps) {
  return (
    <Card
      sx={{
        height: '100%',
        background: theme =>
          `linear-gradient(135deg, ${theme.palette[color].dark} 0%, ${theme.palette[color].main} 100%)`,
        color: 'white',
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
            {trend && (
              <Box display="flex" alignItems="center" mt={1}>
                {trend.positive ? (
                  <TrendingUp fontSize="small" sx={{ mr: 0.5 }} />
                ) : (
                  <TrendingDown fontSize="small" sx={{ mr: 0.5 }} />
                )}
                <Typography variant="body2">{trend.value}</Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 2,
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export function Portfolio() {
  const [activeTab, setActiveTab] = useState(0);

  const {
    data: portfolio,
    isLoading,
    error,
    refetch,
  } = useQuery<PortfolioData>({
    queryKey: ['portfolio'],
    queryFn: () => positionsApi.getPortfolio(),
    refetchInterval: 15000, // Refetch every 15 seconds
  });

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">Failed to load portfolio. Please try again later.</Alert>
      </Container>
    );
  }

  if (!portfolio) {
    return null;
  }

  const { activePositions, settledPositions, stats } = portfolio;

  // Format currency
  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Format profit/loss
  const formatPnL = (value: string) => {
    const num = parseFloat(value);
    const sign = num >= 0 ? '+' : '';
    return `${sign}${formatCurrency(value)}`;
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const totalPnLNum = parseFloat(stats.totalProfitLoss);
  const isProfitable = totalPnLNum >= 0;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Portfolio
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your positions, performance, and earnings
          </Typography>
        </Box>
        <ExportDataButton type="portfolio" />
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Value"
            value={formatCurrency(stats.totalValue)}
            icon={<AccountBalance />}
            color="primary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Profit & Loss"
            value={formatPnL(stats.totalProfitLoss)}
            icon={isProfitable ? <TrendingUp /> : <TrendingDown />}
            trend={{
              value: `${isProfitable ? '+' : ''}${formatPercentage((totalPnLNum / parseFloat(stats.totalVolume || '1')) * 100)}`,
              positive: isProfitable,
            }}
            color={isProfitable ? 'success' : 'error'}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Win Rate"
            value={formatPercentage(stats.winRate)}
            icon={<EmojiEvents />}
            trend={{
              value: `${stats.totalWins}W / ${stats.totalLosses}L`,
              positive: stats.winRate >= 50,
            }}
            color="info"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Volume"
            value={formatCurrency(stats.totalVolume)}
            icon={<ShowChart />}
            trend={{
              value: `Avg: ${formatCurrency(stats.averageBetSize)}`,
              positive: true,
            }}
            color="secondary"
          />
        </Grid>
      </Grid>

      {/* Portfolio Value Chart */}
      <Box mb={4}>
        <PortfolioValueChart height={300} />
      </Box>

      {/* Positions Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            aria-label="portfolio tabs"
          >
            <Tab
              label={`Active Positions (${activePositions.length})`}
              icon={<LocalAtm />}
              iconPosition="start"
            />
            <Tab
              label={`Settled Positions (${settledPositions.length})`}
              icon={<EmojiEvents />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <CardContent>
          {activeTab === 0 && (
            <PositionsList
              positions={activePositions}
              isActive={true}
              onClaimSuccess={() => refetch()}
            />
          )}
          {activeTab === 1 && (
            <PositionsList
              positions={settledPositions}
              isActive={false}
              onClaimSuccess={() => refetch()}
            />
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
