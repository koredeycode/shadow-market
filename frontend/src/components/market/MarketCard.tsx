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
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 12px 40px rgba(124, 58, 237, 0.2)',
          borderColor: 'rgba(124, 58, 237, 0.3)',
        },
      }}
    >
      <CardContent sx={{ flex: 1, p: 3 }}>
        {/* Category & Status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
          <Chip
            label={market.category}
            size="small"
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
            size="small"
            sx={{
              fontWeight: 600,
              borderRadius: 2,
            }}
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
            mb: 3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '3.6em',
            fontWeight: 600,
            lineHeight: 1.4,
            fontSize: '1.1rem',
          }}
        >
          {market.question}
        </Typography>

        {/* Price indicators */}
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  bgcolor: 'rgba(16, 185, 129, 0.15)',
                  borderRadius: 2,
                }}
              >
                <TrendingUp fontSize="small" sx={{ color: 'success.main' }} />
                <Typography variant="body2" fontWeight={700} sx={{ color: 'success.main' }}>
                  YES {yesPercent.toFixed(0)}%
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  bgcolor: 'rgba(239, 68, 68, 0.15)',
                  borderRadius: 2,
                }}
              >
                <Typography variant="body2" fontWeight={700} sx={{ color: 'error.main' }}>
                  NO {noPercent.toFixed(0)}%
                </Typography>
                <TrendingDown fontSize="small" sx={{ color: 'error.main' }} />
              </Box>
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={yesPercent}
            sx={{
              height: 10,
              borderRadius: 2,
              bgcolor: 'rgba(239, 68, 68, 0.2)',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'success.main',
                borderRadius: 2,
              },
            }}
          />
        </Box>

        {/* Stats */}
        <Box
          sx={{
            display: 'flex',
            gap: 3,
            pt: 2.5,
            borderTop: 1,
            borderColor: 'rgba(255, 255, 255, 0.08)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShowChart fontSize="small" sx={{ color: 'secondary.main' }} />
            <Typography variant="body2" fontWeight={600} sx={{ color: 'text.secondary' }}>
              {volume}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTime fontSize="small" sx={{ color: 'warning.main' }} />
            <Typography variant="body2" fontWeight={600} sx={{ color: 'text.secondary' }}>
              {timeLeft}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <CardActions sx={{ p: 3, pt: 0 }}>
        <Button
          component={RouterLink}
          to={`/markets/${market.id}`}
          variant="contained"
          fullWidth
          sx={{ py: 1.25, fontWeight: 600 }}
        >
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
