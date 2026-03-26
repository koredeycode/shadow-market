import {
  Assessment as AnalyticsIcon,
  ShowChart as ChartIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';
import {
  AppBar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Toolbar,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';
import { WalletModal } from '../wallet/WalletModal';

export function Navbar() {
  const { isConnected, isConnecting, formattedAddress, formattedBalance, connectWallet } =
    useWallet();
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const handleWalletClick = () => {
    if (isConnected) {
      setWalletModalOpen(true);
    } else {
      connectWallet();
    }
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(26, 26, 26, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: 1,
          borderColor: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ py: 0.5 }}>
            {/* Logo */}
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{
                mr: 5,
                fontWeight: 800,
                background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontSize: '1.35rem',
                letterSpacing: '-0.02em',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)',
                },
              }}
            >
              🌙 ShadowMarket
            </Typography>

            {/* Navigation */}
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 0.5 }}>
              <Button
                component={RouterLink}
                to="/markets"
                startIcon={<ChartIcon />}
                sx={{
                  color: 'text.primary',
                  fontWeight: 600,
                  px: 2.5,
                  '&:hover': {
                    bgcolor: 'rgba(124, 58, 237, 0.1)',
                    color: 'primary.light',
                  },
                }}
              >
                Markets
              </Button>
              <Button
                component={RouterLink}
                to="/portfolio"
                startIcon={<WalletIcon />}
                sx={{
                  color: 'text.primary',
                  fontWeight: 600,
                  px: 2.5,
                  '&:hover': {
                    bgcolor: 'rgba(124, 58, 237, 0.1)',
                    color: 'primary.light',
                  },
                }}
              >
                Portfolio
              </Button>
              <Button
                component={RouterLink}
                to="/analytics"
                startIcon={<AnalyticsIcon />}
                sx={{
                  color: 'text.primary',
                  fontWeight: 600,
                  px: 2.5,
                  '&:hover': {
                    bgcolor: 'rgba(124, 58, 237, 0.1)',
                    color: 'primary.light',
                  },
                }}
              >
                Analytics
              </Button>
            </Box>

            {/* Right side - Connect Wallet */}
            {isConnected ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  label={formattedBalance}
                  size="medium"
                  sx={{
                    bgcolor: 'rgba(16, 185, 129, 0.15)',
                    color: 'success.light',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    px: 1,
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                />
                <Button
                  variant="outlined"
                  startIcon={<WalletIcon />}
                  onClick={handleWalletClick}
                  sx={{
                    fontWeight: 600,
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                      bgcolor: 'rgba(124, 58, 237, 0.08)',
                    },
                  }}
                >
                  {formattedAddress}
                </Button>
              </Box>
            ) : (
              <Button
                variant="contained"
                startIcon={isConnecting ? <CircularProgress size={18} /> : <WalletIcon />}
                onClick={handleWalletClick}
                disabled={isConnecting}
                sx={{
                  ml: 2,
                  fontWeight: 700,
                  px: 3,
                }}
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Wallet Modal */}
      <WalletModal open={walletModalOpen} onClose={() => setWalletModalOpen(false)} />
    </>
  );
}
