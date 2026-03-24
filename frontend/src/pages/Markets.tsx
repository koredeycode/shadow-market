import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Typography,
  Box,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import { SearchOutlined } from '@mui/icons-material';
import { marketsApi } from '../api/markets';
import { MarketCard } from '@/components/market/MarketCard';
import type { MarketFilters } from '@/types';

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
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h2" sx={{ mb: 2 }}>
          Prediction Markets
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Trade on real-world events with complete privacy
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          select
          label="Status"
          value={filters.status || 'OPEN'}
          onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="OPEN">Open</MenuItem>
          <MenuItem value="LOCKED">Locked</MenuItem>
          <MenuItem value="RESOLVED">Resolved</MenuItem>
        </TextField>

        <TextField
          select
          label="Sort By"
          value={filters.sortBy || 'volume'}
          onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
          sx={{ minWidth: 150 }}
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
          sx={{ flex: 1, maxWidth: 400 }}
        />
      </Box>

      {/* Markets Grid */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          Failed to load markets. Please try again later.
        </Alert>
      )}

      {data && (
        <>
          <Grid container spacing={3}>
            {data.items.map((market) => (
              <Grid item xs={12} md={6} lg={4} key={market.id}>
                <MarketCard market={market} />
              </Grid>
            ))}
          </Grid>

          {data.items.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No markets found
              </Typography>
            </Box>
          )}
        </>
      )}
    </Container>
  );
}
