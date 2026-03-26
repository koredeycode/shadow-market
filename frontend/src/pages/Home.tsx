import { Group, Lock, Speed, TrendingUp } from '@mui/icons-material';
import { Box, Button, Card, CardContent, Container, Grid, Typography, keyframes } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

export function Home() {
  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          py: { xs: 6, md: 10 },
          borderBottom: 1,
          borderColor: 'divider',
          background: 'radial-gradient(ellipse at top, rgba(124, 58, 237, 0.15) 0%, transparent 50%)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '50%',
            width: '150%',
            height: '100%',
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
            transform: 'translateX(-50%)',
            animation: `${float} 6s ease-in-out infinite`,
          },
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              textAlign: 'center',
              mb: 6,
              position: 'relative',
              zIndex: 1,
              animation: `${fadeInUp} 0.8s ease-out`,
            }}
          >
            <Typography
              variant="h1"
              sx={{
                mb: 3,
                background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #06b6d4 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 800,
                fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                lineHeight: 1.2,
                letterSpacing: '-0.03em',
              }}
            >
              Bet on the future,
              <br />
              keep it to yourself
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{
                mb: 5,
                maxWidth: 680,
                mx: 'auto',
                fontSize: { xs: '1.1rem', md: '1.35rem' },
                lineHeight: 1.6,
                fontWeight: 400,
              }}
            >
              Privacy-preserving prediction markets powered by Midnight Network's zero-knowledge
              technology
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 2.5,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Button
                component={RouterLink}
                to="/markets"
                variant="contained"
                size="large"
                sx={{ px: 5, py: 1.5, fontSize: '1.05rem' }}
              >
                Explore Markets
              </Button>
              <Button
                component={RouterLink}
                to="/markets/create"
                variant="outlined"
                size="large"
                sx={{ px: 5, py: 1.5, fontSize: '1.05rem' }}
              >
                Create Market
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Typography
          variant="h3"
          align="center"
          sx={{
            mb: 7,
            fontWeight: 700,
            fontSize: { xs: '2rem', md: '2.5rem' },
          }}
        >
          Why ShadowMarket?
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} lg={3}>
            <Card
              sx={{
                height: '100%',
                textAlign: 'center',
                p: 3,
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 40px rgba(124, 58, 237, 0.25)',
                },
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'inline-flex',
                    p: 2.5,
                    borderRadius: '50%',
                    bgcolor: 'rgba(124, 58, 237, 0.12)',
                    mb: 2.5,
                  }}
                >
                  <Lock sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
                <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mb: 2 }}>
                  Private Betting
                </Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  Your bet amounts remain hidden using zero-knowledge proofs. Only you know your
                  positions.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <Card
              sx={{
                height: '100%',
                textAlign: 'center',
                p: 3,
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 40px rgba(6, 182, 212, 0.25)',
                },
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'inline-flex',
                    p: 2.5,
                    borderRadius: '50%',
                    bgcolor: 'rgba(6, 182, 212, 0.12)',
                    mb: 2.5,
                  }}
                >
                  <TrendingUp sx={{ fontSize: 40, color: 'secondary.main' }} />
                </Box>
                <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mb: 2 }}>
                  Fair Pricing
                </Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  Automated Market Maker ensures fair, transparent pricing based on supply and
                  demand.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <Card
              sx={{
                height: '100%',
                textAlign: 'center',
                p: 3,
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 40px rgba(16, 185, 129, 0.25)',
                },
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'inline-flex',
                    p: 2.5,
                    borderRadius: '50%',
                    bgcolor: 'rgba(16, 185, 129, 0.12)',
                    mb: 2.5,
                  }}
                >
                  <Group sx={{ fontSize: 40, color: 'success.main' }} />
                </Box>
                <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mb: 2 }}>
                  P2P Wagers
                </Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  Create custom odds and match directly with other users for maximum flexibility.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <Card
              sx={{
                height: '100%',
                textAlign: 'center',
                p: 3,
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 40px rgba(245, 158, 11, 0.25)',
                },
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'inline-flex',
                    p: 2.5,
                    borderRadius: '50%',
                    bgcolor: 'rgba(245, 158, 11, 0.12)',
                    mb: 2.5,
                  }}
                >
                  <Speed sx={{ fontSize: 40, color: 'warning.main' }} />
                </Box>
                <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mb: 2 }}>
                  Instant Settlement
                </Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  Decentralized oracles ensure fast, trustless market resolution and payouts.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* CTA */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          py: { xs: 6, md: 8 },
          background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            background: 'radial-gradient(circle at top right, rgba(167, 139, 250, 0.3) 0%, transparent 50%)',
          },
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <Typography
              variant="h3"
              sx={{
                mb: 2.5,
                color: 'white',
                fontWeight: 700,
                fontSize: { xs: '2rem', md: '2.5rem' },
              }}
            >
              Ready to start trading?
            </Typography>
            <Typography
              variant="h6"
              sx={{
                mb: 4,
                color: 'rgba(255,255,255,0.9)',
                lineHeight: 1.6,
                fontSize: { xs: '1.1rem', md: '1.25rem' },
                fontWeight: 400,
              }}
            >
              Connect your Midnight wallet and place your first private bet today.
            </Typography>
            <Button
              component={RouterLink}
              to="/markets"
              variant="contained"
              size="large"
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                px: 5,
                py: 1.5,
                fontSize: '1.05rem',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: 'grey.100',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                },
              }}
            >
              Get Started
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

export default Home;
