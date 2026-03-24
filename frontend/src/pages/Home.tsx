import { Container, Typography, Button, Box, Grid, Card, CardContent } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { TrendingUp, Lock, Speed, Group } from '@mui/icons-material';

export function Home() {
  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          py: 8,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h1"
              sx={{
                mb: 2,
                background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Bet on the future,
              <br />
              keep it to yourself
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
              Privacy-preserving prediction markets powered by Midnight Network's zero-knowledge technology
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                component={RouterLink}
                to="/markets"
                variant="contained"
                size="large"
                sx={{ px: 4 }}
              >
                Explore Markets
              </Button>
              <Button
                component={RouterLink}
                to="/markets/create"
                variant="outlined"
                size="large"
                sx={{ px: 4 }}
              >
                Create Market
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" align="center" sx={{ mb: 6 }}>
          Why ShadowMarket?
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
              <CardContent>
                <Lock sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Private Betting
                </Typography>
                <Typography color="text.secondary">
                  Your bet amounts remain hidden using zero-knowledge proofs. Only you know your positions.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
              <CardContent>
                <TrendingUp sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Fair Pricing
                </Typography>
                <Typography color="text.secondary">
                  Automated Market Maker ensures fair, transparent pricing based on supply and demand.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
              <CardContent>
                <Group sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  P2P Wagers
                </Typography>
                <Typography color="text.secondary">
                  Create custom odds and match directly with other users for maximum flexibility.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
              <CardContent>
                <Speed sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Instant Settlement
                </Typography>
                <Typography color="text.secondary">
                  Decentralized oracles ensure fast, trustless market resolution and payouts.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* CTA */}
      <Box sx={{ bgcolor: 'primary.main', py: 6 }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" sx={{ mb: 2, color: 'white' }}>
              Ready to start trading?
            </Typography>
            <Typography variant="h6" sx={{ mb: 3, color: 'rgba(255,255,255,0.8)' }}>
              Connect your Midnight wallet and place your first private bet today.
            </Typography>
            <Button
              component={RouterLink}
              to="/markets"
              variant="contained"
              size="large"
              sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
            >
              Get Started
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
