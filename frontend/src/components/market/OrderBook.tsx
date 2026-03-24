import { Paper, Typography, Box, Grid } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface OrderBookProps {
  marketId: string;
}

// Placeholder order book - will be implemented with real data later
export function OrderBook({ marketId }: OrderBookProps) {
  // Mock data for demonstration
  const yesOrders = [
    { price: 0.68, amount: 1500 },
    { price: 0.67, amount: 2300 },
    { price: 0.66, amount: 3200 },
    { price: 0.65, amount: 4100 },
    { price: 0.64, amount: 2800 },
  ];

  const noOrders = [
    { price: 0.33, amount: 2100 },
    { price: 0.34, amount: 3400 },
    { price: 0.35, amount: 4200 },
    { price: 0.36, amount: 3100 },
    { price: 0.37, amount: 1900 },
  ];

  const formatAmount = (amount: number) => {
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount}`;
  };

  return (
    <Grid container spacing={3}>
      {/* YES Orders */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <TrendingUp sx={{ color: 'success.main' }} />
            <Typography variant="h6">YES Orders</Typography>
          </Box>

          <Box sx={{ display: 'flex', mb: 1, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
              Price
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1, textAlign: 'right' }}>
              Amount
            </Typography>
          </Box>

          {yesOrders.map((order, idx) => (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Typography variant="body2" sx={{ flex: 1, color: 'success.main' }}>
                {(order.price * 100).toFixed(1)}%
              </Typography>
              <Typography variant="body2" sx={{ flex: 1, textAlign: 'right' }}>
                {formatAmount(order.amount)}
              </Typography>
            </Box>
          ))}
        </Paper>
      </Grid>

      {/* NO Orders */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <TrendingDown sx={{ color: 'error.main' }} />
            <Typography variant="h6">NO Orders</Typography>
          </Box>

          <Box sx={{ display: 'flex', mb: 1, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
              Price
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1, textAlign: 'right' }}>
              Amount
            </Typography>
          </Box>

          {noOrders.map((order, idx) => (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Typography variant="body2" sx={{ flex: 1, color: 'error.main' }}>
                {(order.price * 100).toFixed(1)}%
              </Typography>
              <Typography variant="body2" sx={{ flex: 1, textAlign: 'right' }}>
                {formatAmount(order.amount)}
              </Typography>
            </Box>
          ))}
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="caption" color="text.secondary" fontStyle="italic">
          Note: Order book functionality will be fully implemented in a future update
        </Typography>
      </Grid>
    </Grid>
  );
}
