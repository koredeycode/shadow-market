import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Divider,
  Alert,
} from '@mui/material';
import {
  Close,
  ContentCopy,
  Refresh,
  OpenInNew,
  AccountBalanceWallet,
} from '@mui/icons-material';
import { useWallet } from '../../hooks/useWallet';
import toast from 'react-hot-toast';

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
}

export function WalletModal({ open, onClose }: WalletModalProps) {
  const {
    isConnected,
    address,
    formattedAddress,
    balance,
    formattedBalance,
    networkId,
    disconnectWallet,
    refreshBalance,
  } = useWallet();

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard');
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    onClose();
  };

  const handleViewExplorer = () => {
    // Open address in block explorer (placeholder URL)
    const explorerUrl = `https://explorer.midnight.network/address/${address}`;
    window.open(explorerUrl, '_blank');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceWallet />
            <Typography variant="h6">Wallet</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {isConnected ? (
          <Box>
            {/* Network Info */}
            <Alert severity="success" sx={{ mb: 2 }}>
              Connected to {networkId || 'Midnight Network'}
            </Alert>

            {/* Address Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Wallet Address
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 2,
                  bgcolor: 'background.default',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography
                  variant="body2"
                  fontFamily="monospace"
                  sx={{ flex: 1, wordBreak: 'break-all' }}
                >
                  {address}
                </Typography>
                <IconButton size="small" onClick={handleCopyAddress} title="Copy address">
                  <ContentCopy fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={handleViewExplorer}
                  title="View in explorer"
                >
                  <OpenInNew fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {/* Balance Section */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Balance
                </Typography>
                <IconButton size="small" onClick={refreshBalance} title="Refresh balance">
                  <Refresh fontSize="small" />
                </IconButton>
              </Box>
              <Box
                sx={{
                  p: 3,
                  bgcolor: 'primary.dark',
                  borderRadius: 2,
                  textAlign: 'center',
                }}
              >
                <Typography variant="h4" fontWeight="bold">
                  {formattedBalance}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  DUST (Midnight Token)
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Wallet Info */}
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Wallet Provider
              </Typography>
              <Typography variant="body2">Lace Wallet</Typography>
            </Box>
          </Box>
        ) : (
          <Alert severity="warning">No wallet connected</Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {isConnected && (
          <Button onClick={handleDisconnect} color="error" variant="outlined">
            Disconnect
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
