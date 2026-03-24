import { zodResolver } from '@hookform/resolvers/zod';
import { Close, Info, Timer, TrendingDown, TrendingUp } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { wagersApi } from '../../api/wagers';
import { useWallet } from '../../hooks/useWallet';
import { Market } from '../../types';

const p2pWagerSchema = z.object({
  amount: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Amount must be greater than 0',
  }),
  side: z.enum(['yes', 'no'], {
    required_error: 'Please select YES or NO',
  }),
  oddsNumerator: z.number().min(1).max(100),
  oddsDenominator: z.number().min(1).max(100),
  durationHours: z.number().min(1).max(168), // Max 1 week
});

type P2PWagerFormData = z.infer<typeof p2pWagerSchema>;

interface CreateP2PWagerModalProps {
  open: boolean;
  onClose: () => void;
  market: Market;
}

export function CreateP2PWagerModal({ open, onClose, market }: CreateP2PWagerModalProps) {
  const { isConnected, balance, formattedBalance, connectWallet } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<P2PWagerFormData>({
    resolver: zodResolver(p2pWagerSchema),
    defaultValues: {
      amount: '',
      side: 'yes',
      oddsNumerator: 3,
      oddsDenominator: 1,
      durationHours: 24,
    },
  });

  const amount = watch('amount');
  const side = watch('side');
  const oddsNumerator = watch('oddsNumerator');
  const oddsDenominator = watch('oddsDenominator');
  const durationHours = watch('durationHours');

  // Calculate potential payout for opponent
  const calculatePayoutInfo = () => {
    if (!amount || isNaN(parseFloat(amount))) return null;

    const betAmount = parseFloat(amount);
    const odds = oddsNumerator / oddsDenominator;

    // Your potential win
    const yourPotentialWin = betAmount * odds;

    // Opponent's stake (what they need to put up)
    const opponentStake = yourPotentialWin;

    // Opponent's potential win (your stake)
    const opponentPotentialWin = betAmount;

    // Total pool
    const totalPool = betAmount + opponentStake;

    return {
      yourStake: betAmount,
      yourPotentialWin,
      opponentStake,
      opponentPotentialWin,
      totalPool,
      oddsDisplay: `${oddsNumerator}:${oddsDenominator}`,
      impliedProbability: (oddsDenominator / (oddsNumerator + oddsDenominator)) * 100,
    };
  };

  const payoutInfo = calculatePayoutInfo();

  // Validate amount
  const validateAmount = () => {
    if (!amount) return null;

    const betAmount = parseFloat(amount);
    const minBet = parseFloat(market.minBet);
    const maxBet = parseFloat(market.maxBet);
    const userBalance = parseFloat(balance || '0');

    if (betAmount < minBet) {
      return `Minimum bet is ${minBet}`;
    }
    if (betAmount > maxBet) {
      return `Maximum bet is ${maxBet}`;
    }
    if (betAmount > userBalance) {
      return `Insufficient balance. You have ${formattedBalance}`;
    }
    return null;
  };

  const amountError = validateAmount();

  const mutation = useMutation({
    mutationFn: async (data: P2PWagerFormData) => {
      if (!isConnected) {
        throw new Error('Wallet not connected');
      }

      const response = await wagersApi.createP2PWager({
        marketId: market.id,
        amount: data.amount,
        side: data.side,
        odds: [data.oddsNumerator, data.oddsDenominator],
        duration: data.durationHours * 3600, // Convert to seconds
      });

      return response;
    },
    onSuccess: data => {
      toast.success('P2P wager created! Waiting for someone to accept...');
      queryClient.invalidateQueries({ queryKey: ['market', market.id] });
      queryClient.invalidateQueries({ queryKey: ['p2p-wagers', market.id] });
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create wager');
    },
  });

  const onSubmit = async (data: P2PWagerFormData) => {
    if (amountError) {
      toast.error(amountError);
      return;
    }

    setIsSubmitting(true);
    try {
      await mutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Create P2P Wager</Typography>
          <IconButton onClick={handleClose} size="small" disabled={isSubmitting}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {/* Market Info */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Market
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {market.question}
            </Typography>
          </Box>

          {/* Connect Wallet */}
          {!isConnected ? (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                Please connect your wallet to create a P2P wager
              </Typography>
              <Button onClick={connectWallet} variant="contained" size="small" sx={{ mt: 1 }}>
                Connect Wallet
              </Button>
            </Alert>
          ) : (
            <>
              {/* P2P Explanation */}
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  P2P wagers let you bet directly against another user with custom odds. No fees!
                </Typography>
              </Alert>

              {/* Side Selection */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Your Side
                </Typography>
                <Controller
                  name="side"
                  control={control}
                  render={({ field }) => (
                    <ToggleButtonGroup {...field} exclusive fullWidth sx={{ mt: 1 }}>
                      <ToggleButton
                        value="yes"
                        sx={{
                          '&.Mui-selected': {
                            bgcolor: 'success.dark',
                            color: 'success.contrastText',
                            '&:hover': { bgcolor: 'success.main' },
                          },
                        }}
                      >
                        <TrendingUp sx={{ mr: 1 }} />
                        YES
                      </ToggleButton>
                      <ToggleButton
                        value="no"
                        sx={{
                          '&.Mui-selected': {
                            bgcolor: 'error.dark',
                            color: 'error.contrastText',
                            '&:hover': { bgcolor: 'error.main' },
                          },
                        }}
                      >
                        <TrendingDown sx={{ mr: 1 }} />
                        NO
                      </ToggleButton>
                    </ToggleButtonGroup>
                  )}
                />
              </Box>

              {/* Amount Input */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Your Stake
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Balance: {formattedBalance}
                  </Typography>
                </Box>
                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      placeholder="0.00"
                      error={!!errors.amount || !!amountError}
                      helperText={errors.amount?.message || amountError}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Typography variant="body2" color="text.secondary">
                              DUST
                            </Typography>
                          </InputAdornment>
                        ),
                      }}
                      inputProps={{
                        min: 0,
                        step: 'any',
                      }}
                    />
                  )}
                />
              </Box>

              {/* Custom Odds */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Custom Odds
                  </Typography>
                  <Info
                    fontSize="small"
                    color="disabled"
                    titleAccess="Example: 3:1 means you win 3x your stake if you win"
                  />
                </Box>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={5}>
                    <Controller
                      name="oddsNumerator"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="number"
                          label="Win Multiple"
                          error={!!errors.oddsNumerator}
                          helperText={errors.oddsNumerator?.message}
                          inputProps={{
                            min: 1,
                            max: 100,
                            step: 0.1,
                          }}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 1)}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={2} sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" color="text.secondary">
                      :
                    </Typography>
                  </Grid>
                  <Grid item xs={5}>
                    <Controller
                      name="oddsDenominator"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="number"
                          label="Stake Multiple"
                          error={!!errors.oddsDenominator}
                          helperText={errors.oddsDenominator?.message}
                          inputProps={{
                            min: 1,
                            max: 100,
                            step: 0.1,
                          }}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 1)}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Duration */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Timer fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    Wager Expiration (Hours)
                  </Typography>
                </Box>
                <Controller
                  name="durationHours"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      error={!!errors.durationHours}
                      helperText={
                        errors.durationHours?.message ||
                        'How long before wager expires if not accepted'
                      }
                      inputProps={{
                        min: 1,
                        max: 168,
                        step: 1,
                      }}
                      onChange={e => field.onChange(parseInt(e.target.value) || 24)}
                    />
                  )}
                />
              </Box>

              {/* Payout Info */}
              {payoutInfo && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="medium" gutterBottom>
                      Wager Details
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Odds
                      </Typography>
                      <Typography variant="caption" fontWeight="bold">
                        {payoutInfo.oddsDisplay}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Your Stake
                      </Typography>
                      <Typography variant="caption">
                        {payoutInfo.yourStake.toFixed(2)} DUST
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Your Potential Win
                      </Typography>
                      <Typography variant="caption" color="success.main" fontWeight="medium">
                        {payoutInfo.yourPotentialWin.toFixed(2)} DUST
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Opponent Needs
                      </Typography>
                      <Typography variant="caption">
                        {payoutInfo.opponentStake.toFixed(2)} DUST
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Total Pool
                      </Typography>
                      <Typography variant="caption" fontWeight="medium">
                        {payoutInfo.totalPool.toFixed(2)} DUST
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">
                        Implied Probability
                      </Typography>
                      <Typography variant="caption">
                        {payoutInfo.impliedProbability.toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!isConnected || isSubmitting || !!amountError || !amount}
            startIcon={isSubmitting && <CircularProgress size={16} />}
          >
            {isSubmitting ? 'Creating...' : 'Create Wager'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
