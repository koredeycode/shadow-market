import { MarketCard } from '@/components/market/MarketCard';
import type { MarketFilters } from '@/types';
import { SearchOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { marketsApi } from '../api/markets';

export function Markets() {
  const [filters, setFilters] = useState<MarketFilters>({
    status: 'OPEN',
    sortBy: 'volume',
    limit: 20,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['markets', filters],
    queryFn: () => marketsApi.getAll(filters),
    refetchInterval: 10000, // Refresh every 10s
  });

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
      <Box sx={{ mb: 5 }}>
        <Typography
          variant="h2"
          sx={{ mb: 2, fontWeight: 700, fontSize: { xs: '2rem', md: '2.5rem' } }}
        >
          Prediction Markets
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
          Trade on real-world events with complete privacy
        </Typography>
      </Box>

      {/* Filters */}
      <Box
        sx={{
          mb: 5,
          p: 3,
          bgcolor: 'rgba(26, 26, 26, 0.6)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 3,
          display: 'flex',
          gap: 2.5,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <TextField
          select
          label="Status"
          value={filters.status || 'OPEN'}
          onChange={e => setFilters({ ...filters, status: e.target.value as any })}
          sx={{ minWidth: 160 }}
          size="medium"
        >
          <MenuItem value="OPEN">Open</MenuItem>
          <MenuItem value="LOCKED">Locked</MenuItem>
          <MenuItem value="RESOLVED">Resolved</MenuItem>
        </TextField>

        <TextField
          select
          label="Sort By"
          value={filters.sortBy || 'volume'}
          onChange={e => setFilters({ ...filters, sortBy: e.target.value as any })}
          sx={{ minWidth: 180 }}
          size="medium"
        >
          <MenuItem value="volume">Volume</MenuItem>
          <MenuItem value="liquidity">Liquidity</MenuItem>
          <MenuItem value="ending_soon">Ending Soon</MenuItem>
          <MenuItem value="newest">Newest</MenuItem>
        </TextField>

        <TextField
          placeholder="Search markets..."
          InputProps={{
            startAdornment: <SearchOutlined sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ flex: 1, maxWidth: 450 }}
          size="medium"
        />
      </Box>

      {/* Markets Grid */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress size={50} thickness={3.5} />
        </Box>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 4,
            borderRadius: 3,
            border: '1px solid rgba(239, 68, 68, 0.3)',
            bgcolor: 'rgba(239, 68, 68, 0.1)',
          }}
        >
          Failed to load markets. Please try again later.
        </Alert>
      )}

      {data && (
        <>
          <Grid container spacing={3.5}>
            {data.items.map(market => (
              <Grid item xs={12} sm={6} lg={4} key={market.id}>
                <MarketCard market={market} />
              </Grid>
            ))}
          </Grid>

          {data.items.length === 0 && (
            <Box
              sx={{
                textAlign: 'center',
                py: 10,
                borderRadius: 3,
                border: '2px dashed rgba(255, 255, 255, 0.1)',
                bgcolor: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <Typography variant="h5" color="text.secondary" fontWeight={600}>
                No markets found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Try adjusting your filters or check back later
              </Typography>
            </Box>
          )}
        </>
      )}
    </Container>
  );
}

export default Markets;
