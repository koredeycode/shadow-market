import type { Market } from '@/types';
import { AccessTime, ShowChart, TrendingDown, TrendingUp } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  LinearProgress,
  Typography,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';

interface MarketCardProps {
  market: Market;
}

export function MarketCard({ market }: MarketCardProps) {
  const yesPercent = parseFloat(market.yesPrice) * 100;
  const noPercent = parseFloat(market.noPrice) * 100;
  const volume = formatVolume(market.totalVolume);
  const timeLeft = formatDistanceToNow(new Date(market.endTime), { addSuffix: true });

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flex: 1 }}>
        {/* Category & Status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Chip label={market.category} size="small" sx={{ textTransform: 'capitalize' }} />
          <Chip
            label={market.status}
            size="small"
            color={
              market.status === 'OPEN'
                ? 'success'
                : market.status === 'RESOLVED'
                  ? 'default'
                  : 'warning'
            }
          />
        </Box>

        {/* Question */}
        <Typography
          variant="h6"
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '3.6em',
          }}
        >
          {market.question}
        </Typography>

        {/* Price indicators */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TrendingUp fontSize="small" color="success" />
              <Typography variant="body2" fontWeight={600}>
                YES {yesPercent.toFixed(0)}%
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="body2" fontWeight={600}>
                NO {noPercent.toFixed(0)}%
              </Typography>
              <TrendingDown fontSize="small" color="error" />
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={yesPercent}
            sx={{
              height: 8,
              borderRadius: 1,
              bgcolor: 'error.dark',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'success.main',
              },
            }}
          />
        </Box>

        {/* Stats */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            pt: 2,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ShowChart fontSize="small" sx={{ color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {volume}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTime fontSize="small" sx={{ color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {timeLeft}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button component={RouterLink} to={`/markets/${market.id}`} variant="contained" fullWidth>
          Trade Now
        </Button>
      </CardActions>
    </Card>
  );
}

function formatVolume(volume: string): string {
  const num = parseFloat(volume);
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `$${(num / 1000).toFixed(1)}K`;
  }
  return `$${num.toFixed(0)}`;
}
