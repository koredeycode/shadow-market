import { TrendingDown, TrendingUp } from '@mui/icons-material';
import { Box, Chip, Paper, Typography } from '@mui/material';

interface RecentTradesProps {
  marketId: string;
}

interface Trade {
  id: string;
  side: 'yes' | 'no';
  price: number;
  amount: number;
  timestamp: number;
}

// Placeholder trades - will be implemented with real data later
export function RecentTrades({ marketId }: RecentTradesProps) {
  // Mock data for demonstration
  const trades: Trade[] = [
    { id: '1', side: 'yes', price: 0.67, amount: 1200, timestamp: Date.now() - 5 * 60 * 1000 },
    { id: '2', side: 'no', price: 0.34, amount: 800, timestamp: Date.now() - 12 * 60 * 1000 },
    { id: '3', side: 'yes', price: 0.66, amount: 2500, timestamp: Date.now() - 25 * 60 * 1000 },
    { id: '4', side: 'yes', price: 0.65, amount: 1800, timestamp: Date.now() - 38 * 60 * 1000 },
    { id: '5', side: 'no', price: 0.35, amount: 1500, timestamp: Date.now() - 55 * 60 * 1000 },
    { id: '6', side: 'yes', price: 0.64, amount: 3200, timestamp: Date.now() - 72 * 60 * 1000 },
    { id: '7', side: 'no', price: 0.36, amount: 900, timestamp: Date.now() - 95 * 60 * 1000 },
    { id: '8', side: 'yes', price: 0.63, amount: 2100, timestamp: Date.now() - 120 * 60 * 1000 },
  ];

  const formatAmount = (amount: number) => {
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount}`;
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Recent Trades
      </Typography>

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          mb: 2,
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          Side
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1, textAlign: 'center' }}>
          Price
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1, textAlign: 'center' }}>
          Amount
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1, textAlign: 'right' }}>
          Time
        </Typography>
      </Box>

      {/* Trades */}
      {trades.map(trade => (
        <Box
          key={trade.id}
          sx={{
            display: 'flex',
            alignItems: 'center',
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            {trade.side === 'yes' ? (
              <>
                <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
                <Chip
                  label="YES"
                  size="small"
                  sx={{
                    bgcolor: 'success.dark',
                    color: 'success.contrastText',
                    fontWeight: 'bold',
                  }}
                />
              </>
            ) : (
              <>
                <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
                <Chip
                  label="NO"
                  size="small"
                  sx={{
                    bgcolor: 'error.dark',
                    color: 'error.contrastText',
                    fontWeight: 'bold',
                  }}
                />
              </>
            )}
          </Box>

          <Typography
            variant="body2"
            sx={{
              flex: 1,
              textAlign: 'center',
              color: trade.side === 'yes' ? 'success.main' : 'error.main',
              fontWeight: 'medium',
            }}
          >
            {(trade.price * 100).toFixed(1)}%
          </Typography>

          <Typography variant="body2" sx={{ flex: 1, textAlign: 'center' }}>
            {formatAmount(trade.amount)}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ flex: 1, textAlign: 'right' }}>
            {formatTime(trade.timestamp)}
          </Typography>
        </Box>
      ))}

      <Typography
        variant="caption"
        color="text.secondary"
        fontStyle="italic"
        sx={{ display: 'block', mt: 2 }}
      >
        Note: Real-time trade data will be implemented in a future update
      </Typography>
    </Paper>
  );
}
