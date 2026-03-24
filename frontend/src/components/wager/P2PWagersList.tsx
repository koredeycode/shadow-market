import { AccessTime, Close, Person, TrendingDown, TrendingUp } from '@mui/icons-material';
import { Alert, Box, Button, Chip, CircularProgress, Grid, Paper, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { wagersApi } from '../../api/wagers';
import { useWallet } from '../../hooks/useWallet';
import { Wager } from '../../types';

interface P2PWagersListProps {
  marketId: string;
}

function WagerCard({
  wager,
  onAccept,
  onCancel,
  isUserCreator,
  isAccepting,
  isCanceling,
}: {
  wager: Wager;
  onAccept?: () => void;
  onCancel?: () => void;
  isUserCreator: boolean;
  isAccepting: boolean;
  isCanceling: boolean;
}) {
  const { isConnected } = useWallet();

  const [oddsNum, oddsDenom] = wager.odds;
  const betAmount = parseFloat(wager.amount);
  const potentialWin = betAmount * (oddsNum / oddsDenom);
  const opponentStake = potentialWin;

  const timeRemaining = () => {
    const now = Date.now();
    const expires = new Date(wager.expiresAt).getTime();
    const diff = expires - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <Paper
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': isUserCreator
          ? undefined
          : {
              borderColor: 'primary.main',
              boxShadow: 2,
            },
      }}
    >
      <Grid container spacing={2} alignItems="center">
        {/* Creator Side */}
        <Grid item xs={12} sm={5}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {wager.creatorSide === 'yes' ? (
                <Chip
                  icon={<TrendingUp />}
                  label="YES"
                  size="small"
                  sx={{
                    bgcolor: 'success.dark',
                    color: 'success.contrastText',
                  }}
                />
              ) : (
                <Chip
                  icon={<TrendingDown />}
                  label="NO"
                  size="small"
                  sx={{
                    bgcolor: 'error.dark',
                    color: 'error.contrastText',
                  }}
                />
              )}
              {isUserCreator && (
                <Chip label="Your Wager" size="small" color="primary" variant="outlined" />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Creator Stakes
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {betAmount.toFixed(2)} DUST
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Wins {potentialWin.toFixed(2)} DUST
            </Typography>
          </Box>
        </Grid>

        {/* Odds Display */}
        <Grid item xs={12} sm={2} sx={{ textAlign: 'center' }}>
          <Typography variant="h5" fontWeight="bold" color="primary.main">
            {oddsNum}:{oddsDenom}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Odds
          </Typography>
        </Grid>

        {/* Opponent Side */}
        <Grid item xs={12} sm={5}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {wager.creatorSide === 'yes' ? (
                <Chip
                  icon={<TrendingDown />}
                  label="NO"
                  size="small"
                  sx={{
                    bgcolor: 'error.dark',
                    color: 'error.contrastText',
                  }}
                />
              ) : (
                <Chip
                  icon={<TrendingUp />}
                  label="YES"
                  size="small"
                  sx={{
                    bgcolor: 'success.dark',
                    color: 'success.contrastText',
                  }}
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Opponent Needs
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {opponentStake.toFixed(2)} DUST
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Wins {betAmount.toFixed(2)} DUST
            </Typography>
          </Box>
        </Grid>

        {/* Footer */}
        <Grid item xs={12}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Person fontSize="small" color="disabled" />
                <Typography variant="caption" color="text.secondary">
                  {wager.creator?.username || `${wager.creatorId.slice(0, 6)}...`}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTime fontSize="small" color="disabled" />
                <Typography variant="caption" color="text.secondary">
                  {timeRemaining()}
                </Typography>
              </Box>
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              {isUserCreator ? (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={isCanceling ? <CircularProgress size={16} /> : <Close />}
                  onClick={onCancel}
                  disabled={isCanceling}
                >
                  Cancel
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="contained"
                  onClick={onAccept}
                  disabled={!isConnected || isAccepting}
                  startIcon={isAccepting && <CircularProgress size={16} />}
                >
                  {isAccepting ? 'Accepting...' : 'Accept Wager'}
                </Button>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}

export function P2PWagersList({ marketId }: P2PWagersListProps) {
  const { address } = useWallet();
  const queryClient = useQueryClient();

  const {
    data: wagers,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['p2p-wagers', marketId],
    queryFn: async () => {
      // In real implementation, this would call an API endpoint
      // For now, returning empty array as placeholder
      return [] as Wager[];
    },
    refetchInterval: 10000,
  });

  const acceptMutation = useMutation({
    mutationFn: async (wagerId: string) => {
      return await wagersApi.acceptWager(wagerId, { wagerId });
    },
    onSuccess: () => {
      toast.success('Wager accepted! Good luck!');
      queryClient.invalidateQueries({ queryKey: ['p2p-wagers', marketId] });
      queryClient.invalidateQueries({ queryKey: ['market', marketId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to accept wager');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (wagerId: string) => {
      return await wagersApi.cancelWager(wagerId);
    },
    onSuccess: () => {
      toast.success('Wager cancelled');
      queryClient.invalidateQueries({ queryKey: ['p2p-wagers', marketId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel wager');
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load P2P wagers</Alert>;
  }

  if (!wagers || wagers.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Open P2P Wagers
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Be the first to create a peer-to-peer wager!
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {wagers.length} open wager{wagers.length !== 1 ? 's' : ''}
      </Typography>

      {wagers.map(wager => {
        const isUserCreator = address === wager.creatorId;
        return (
          <WagerCard
            key={wager.id}
            wager={wager}
            isUserCreator={isUserCreator}
            onAccept={() => acceptMutation.mutate(wager.id)}
            onCancel={() => cancelMutation.mutate(wager.id)}
            isAccepting={acceptMutation.isPending && acceptMutation.variables === wager.id}
            isCanceling={cancelMutation.isPending && cancelMutation.variables === wager.id}
          />
        );
      })}
    </Box>
  );
}
