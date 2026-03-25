import {
  AccessTime,
  AccountBalance,
  CheckCircle,
  People,
  ShowChart,
  Source,
} from '@mui/icons-material';
import { Box, Grid, Paper, Typography } from '@mui/material';
import { Market } from '../../types';

interface MarketStatsProps {
  market: Market;
}

const formatVolume = (volume: string): string => {
  const num = parseFloat(volume);
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
  return `$${num.toFixed(0)}`;
};

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getTimeRemaining = (endTime: number): string => {
  const now = Date.now();
  const diff = endTime - now;

  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h remaining`;

  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${minutes}m remaining`;
};

export function MarketStats({ market }: MarketStatsProps) {
  const stats = [
    {
      icon: <ShowChart />,
      label: 'Total Volume',
      value: formatVolume(market.totalVolume),
      color: 'primary.main',
    },
    {
      icon: <AccountBalance />,
      label: 'Total Liquidity',
      value: formatVolume(market.totalLiquidity),
      color: 'secondary.main',
    },
    {
      icon: <People />,
      label: 'Total Positions',
      value: market.totalPositions.toString(),
      color: 'info.main',
    },
    {
      icon: <AccessTime />,
      label: 'Time Remaining',
      value: getTimeRemaining(market.endTime),
      color: 'warning.main',
    },
    {
      icon: <CheckCircle />,
      label: 'Created',
      value: formatDate(market.createdAt),
      color: 'success.main',
    },
    {
      icon: <Source />,
      label: 'Resolution Source',
      value: market.resolutionSource,
      color: 'text.secondary',
    },
  ];

  return (
    <Grid container spacing={3}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 1,
              }}
            >
              <Box
                sx={{
                  color: stat.color,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {stat.icon}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {stat.label}
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight="bold">
              {stat.value}
            </Typography>
          </Paper>
        </Grid>
      ))}

      {/* Market Details */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Market Details
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Category
              </Typography>
              <Typography variant="body1" fontWeight="medium" sx={{ textTransform: 'capitalize' }}>
                {market.category}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Minimum Bet
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatVolume(market.minBet)}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Maximum Bet
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatVolume(market.maxBet)}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                End Time
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatDate(market.endTime)}
              </Typography>
            </Grid>

            {market.resolvedAt && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Resolved At
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatDate(market.resolvedAt)}
                </Typography>
              </Grid>
            )}

            {market.tags && market.tags.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {market.tags.map((tag, idx) => (
                    <Typography
                      key={idx}
                      variant="body2"
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      {tag}
                    </Typography>
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
}
