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
        sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            {/* Logo */}
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{
                mr: 4,
                fontWeight: 700,
                color: 'primary.main',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              🌙 ShadowMarket
            </Typography>

            {/* Navigation */}
            <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
              <Button
                component={RouterLink}
                to="/markets"
                startIcon={<ChartIcon />}
                sx={{ color: 'text.primary' }}
              >
                Markets
              </Button>
              <Button
                component={RouterLink}
                to="/portfolio"
                startIcon={<WalletIcon />}
                sx={{ color: 'text.primary' }}
              >
                Portfolio
              </Button>
              <Button
                component={RouterLink}
                to="/analytics"
                startIcon={<AnalyticsIcon />}
                sx={{ color: 'text.primary' }}
              >
                Analytics
              </Button>
            </Box>

            {/* Right side - Connect Wallet */}
            {isConnected ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  label={formattedBalance}
                  size="small"
                  sx={{
                    bgcolor: 'success.dark',
                    color: 'success.contrastText',
                    fontWeight: 'bold',
                  }}
                />
                <Button
                  variant="outlined"
                  startIcon={<WalletIcon />}
                  onClick={handleWalletClick}
                  sx={{ ml: 1 }}
                >
                  {formattedAddress}
                </Button>
              </Box>
            ) : (
              <Button
                variant="contained"
                startIcon={isConnecting ? <CircularProgress size={16} /> : <WalletIcon />}
                onClick={handleWalletClick}
                disabled={isConnecting}
                sx={{ ml: 2 }}
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
