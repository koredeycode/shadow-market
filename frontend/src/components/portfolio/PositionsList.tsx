import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  LinearProgress,
  Alert,
  Link as MuiLink,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccessTime,
  CheckCircle,
  Cancel,
  OpenInNew,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Position, positionsApi } from '../../api/positions';

interface PositionCardProps {
  position: Position;
  isActive: boolean;
  onClaimSuccess: () => void;
}

function PositionCard({ position, isActive, onClaimSuccess }: PositionCardProps) {
  const queryClient = useQueryClient();
  const [claiming, setClaiming] = useState(false);

  const claimMutation = useMutation({
    mutationFn: () => positionsApi.claimWinnings(position.id),
    onSuccess: (data) => {
      toast.success(`Successfully claimed ${formatCurrency(data.amount)}!`);
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      onClaimSuccess();
      setClaiming(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to claim winnings');
      setClaiming(false);
    },
  });

  const handleClaim = () => {
    setClaiming(true);
    claimMutation.mutate();
  };

  // Format currency
  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Calculate P&L
  const calculatePnL = () => {
    if (position.isSettled && position.profitLoss) {
      return parseFloat(position.profitLoss);
    }

    // For active positions, calculate unrealized P&L
    const currentValue = parseFloat(position.amount) * position.currentPrice;
    const entryValue = parseFloat(position.amount) * position.entryPrice;
    return currentValue - entryValue;
  };

  // Calculate ROI
  const calculateROI = () => {
    const pnl = calculatePnL();
    const investment = parseFloat(position.amount) * position.entryPrice;
    return ((pnl / investment) * 100);
  };

  const pnl = calculatePnL();
  const roi = calculateROI();
  const isProfitable = pnl >= 0;

  // Format time
  const formatTimeRemaining = (endTimeStr: string) => {
    const endTime = new Date(endTimeStr).getTime();
    const now = Date.now();
    const diff = endTime - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Can claim if settled, has payout, and payout > 0
  const canClaim = position.isSettled && position.payout && parseFloat(position.payout) > 0;

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card
      sx={{
        mb: 2,
        border: 1,
        borderColor: position.isSettled
          ? pnl >= 0
            ? 'success.main'
            : 'error.main'
          : 'divider',
        '&:hover': {
          boxShadow: 3,
        },
      }}
    >
      <CardContent>
        <Grid container spacing={2}>
          {/* Question & Status */}
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="flex-start" gap={1} mb={1}>
              <MuiLink
                component={Link}
                to={`/markets/${position.marketId}`}
                sx={{
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                <Typography variant="h6" fontWeight="bold">
                  {position.marketQuestion}
                </Typography>
              </MuiLink>
              <OpenInNew fontSize="small" sx={{ color: 'text.secondary', mt: 0.5 }} />
            </Box>

            <Box display="flex" gap={1} mb={2} flexWrap="wrap">
              <Chip
                label={position.side.toUpperCase()}
                size="small"
                icon={position.side === 'yes' ? <TrendingUp /> : <TrendingDown />}
                color={position.side === 'yes' ? 'success' : 'error'}
              />

              {position.marketStatus === 'resolved' && position.marketOutcome !== undefined && (
                <Chip
                  label={position.marketOutcome === 1 ? 'YES WON' : 'NO WON'}
                  size="small"
                  color={
                    (position.side === 'yes' && position.marketOutcome === 1) ||
                    (position.side === 'no' && position.marketOutcome === 0)
                      ? 'success'
                      : 'error'
                  }
                  icon={
                    (position.side === 'yes' && position.marketOutcome === 1) ||
                    (position.side === 'no' && position.marketOutcome === 0) ? (
                      <CheckCircle />
                    ) : (
                      <Cancel />
                    )
                  }
                />
              )}

              {!position.isSettled && position.marketStatus === 'open' && (
                <Chip
                  label={formatTimeRemaining(position.marketEndTime)}
                  size="small"
                  icon={<AccessTime />}
                  color="default"
                  variant="outlined"
                />
              )}
            </Box>

            <Typography variant="body2" color="text.secondary">
              Entered: {formatDate(position.entryTimestamp)}
            </Typography>
            {position.settledAt && (
              <Typography variant="body2" color="text.secondary">
                Settled: {formatDate(position.settledAt)}
              </Typography>
            )}
          </Grid>

          {/* Position Details */}
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Amount
                </Typography>
                <Typography variant="h6">{formatCurrency(position.amount)}</Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Entry Price
                </Typography>
                <Typography variant="h6">
                  {(position.entryPrice * 100).toFixed(1)}%
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Current Price
                </Typography>
                <Typography variant="h6">
                  {(position.currentPrice * 100).toFixed(1)}%
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {isActive ? 'Unrealized P&L' : 'Realized P&L'}
                </Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Typography
                    variant="h6"
                    color={isProfitable ? 'success.main' : 'error.main'}
                    fontWeight="bold"
                  >
                    {isProfitable ? '+' : ''}
                    {formatCurrency(pnl.toString())}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ({isProfitable ? '+' : ''}
                    {roi.toFixed(1)}%)
                  </Typography>
                </Box>
              </Grid>

              {position.isSettled && position.payout && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Payout
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary.main">
                    {formatCurrency(position.payout)}
                  </Typography>
                </Grid>
              )}
            </Grid>

            {/* Claim Button */}
            {canClaim && (
              <Box mt={2}>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  onClick={handleClaim}
                  disabled={claiming || claimMutation.isPending}
                  startIcon={claiming ? undefined : <CheckCircle />}
                >
                  {claiming || claimMutation.isPending
                    ? 'Claiming...'
                    : `Claim ${formatCurrency(position.payout!)}`}
                </Button>
                {claiming && <LinearProgress sx={{ mt: 1 }} />}
              </Box>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

interface PositionsListProps {
  positions: Position[];
  isActive: boolean;
  onClaimSuccess: () => void;
}

export function PositionsList({ positions, isActive, onClaimSuccess }: PositionsListProps) {
  if (positions.length === 0) {
    return (
      <Box py={8} textAlign="center">
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {isActive ? 'No Active Positions' : 'No Settled Positions'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isActive
            ? 'Place a bet on a market to see your positions here'
            : 'Your settled positions will appear here once markets resolve'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {positions.map((position) => (
        <PositionCard
          key={position.id}
          position={position}
          isActive={isActive}
          onClaimSuccess={onClaimSuccess}
        />
      ))}
    </Box>
  );
}
