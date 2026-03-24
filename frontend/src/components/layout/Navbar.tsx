import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Container,
  Button,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import {
  ShowChart as ChartIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';

export function Navbar() {
  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
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
          </Box>

          {/* Right side - Connect Wallet */}
          <Button
            variant="contained"
            startIcon={<WalletIcon />}
            sx={{ ml: 2 }}
          >
            Connect Wallet
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
