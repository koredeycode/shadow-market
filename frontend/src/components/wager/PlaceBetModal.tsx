import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Slider,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  Close,
  TrendingUp,
  TrendingDown,
  Info,
} from '@mui/icons-material';
import { useWallet } from '../../hooks/useWallet';
import { wagersApi } from '../../api/wagers';
import { Market } from '../../types';
import toast from 'react-hot-toast';

const betSchema = z.object({
  amount: z.string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Amount must be greater than 0',
    }),
  side: z.enum(['yes', 'no'], {
    required_error: 'Please select YES or NO',
  }),
  slippage: z.number().min(0).max(50).default(1),
});

type BetFormData = z.infer<typeof betSchema>;

interface PlaceBetModalProps {
  open: boolean;
  onClose: () => void;
  market: Market;
}

export function PlaceBetModal({ open, onClose, market }: PlaceBetModalProps) {
  const { isConnected, balance, formattedBalance, connectWallet, signTransaction } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<BetFormData>({
    resolver: zodResolver(betSchema),
    defaultValues: {
      amount: '',
      side: 'yes',
      slippage: 1,
    },
  });

  const amount = watch('amount');
  const side = watch('side');
  const slippage = watch('slippage');

  // Calculate price estimate with slippage
  const calculatePriceEstimate = () => {
    if (!amount || isNaN(parseFloat(amount))) return null;

    const basePrice = side === 'yes' ? parseFloat(market.yesPrice) : parseFloat(market.noPrice);
    const betAmount = parseFloat(amount);
    
    // Simplified price impact calculation
    // In real implementation, this would call the AMM formula
    const liquidityFactor = parseFloat(market.totalLiquidity) || 1000000;
    const priceImpact = (betAmount / liquidityFactor) * 0.1; // 10% of ratio as impact
    
    const estimatedPrice = basePrice + (side === 'yes' ? priceImpact : -priceImpact);
    const maxPrice = estimatedPrice * (1 + slippage / 100);
    const minPrice = estimatedPrice * (1 - slippage / 100);
    
    const potentialPayout = betAmount / estimatedPrice;
    const potentialProfit = potentialPayout - betAmount;

    return {
      basePrice,
      estimatedPrice,
      maxPrice: Math.min(maxPrice, 1),
      minPrice: Math.max(minPrice, 0),
      priceImpact: priceImpact * 100,
      potentialPayout,
      potentialProfit,
      breakeven: estimatedPrice,
    };
  };

  const estimate = calculatePriceEstimate();

  // Validate bet amount
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
    mutationFn: async (data: BetFormData) => {
      if (!isConnected) {
        throw new Error('Wallet not connected');
      }

      // In a real implementation, this would:
      // 1. Generate ZK proof for the commitment
      // 2. Create transaction data
      // 3. Sign with wallet
      // 4. Submit to backend

      // Placeholder for transaction signing
      const txData = {
        to: market.contractAddress,
        data: `placeBet(${data.amount},${data.side})`,
        value: data.amount,
      };

      // Sign transaction (simplified)
      // const signedTx = await signTransaction(txData);

      // Submit to backend
      const response = await wagersApi.placeBet({
        marketId: market.id,
        amount: data.amount,
        side: data.side,
        slippage: data.slippage,
      });

      return response;
    },
    onSuccess: (data) => {
      toast.success(`Bet placed successfully! Position ID: ${data.positionId.slice(0, 8)}...`);
      queryClient.invalidateQueries({ queryKey: ['market', market.id] });
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to place bet');
    },
  });

  const onSubmit = async (data: BetFormData) => {
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
          <Typography variant="h6">Place Bet</Typography>
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
                Please connect your wallet to place a bet
              </Typography>
              <Button onClick={connectWallet} variant="contained" size="small" sx={{ mt: 1 }}>
                Connect Wallet
              </Button>
            </Alert>
          ) : (
            <>
              {/* Side Selection */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Choose Side
                </Typography>
                <Controller
                  name="side"
                  control={control}
                  render={({ field }) => (
                    <ToggleButtonGroup
                      {...field}
                      exclusive
                      fullWidth
                      sx={{ mt: 1 }}
                    >
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
                        YES {(parseFloat(market.yesPrice) * 100).toFixed(1)}%
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
                        NO {(parseFloat(market.noPrice) * 100).toFixed(1)}%
                      </ToggleButton>
                    </ToggleButtonGroup>
                  )}
                />
                {errors.side && (
                  <Typography variant="caption" color="error">
                    {errors.side.message}
                  </Typography>
                )}
              </Box>

              {/* Amount Input */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Amount
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
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  {[25, 50, 75, 100].map((percent) => (
                    <Button
                      key={percent}
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        const userBalance = parseFloat(balance || '0');
                        const amount = (userBalance * percent) / 100;
                        control._formValues.amount = amount.toString();
                        control._subjects.values.next(control._formValues);
                      }}
                    >
                      {percent}%
                    </Button>
                  ))}
                </Box>
              </Box>

              {/* Slippage Tolerance */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Slippage Tolerance
                  </Typography>
                  <Info fontSize="small" color="disabled" titleAccess="Maximum price movement you'll accept" />
                </Box>
                <Controller
                  name="slippage"
                  control={control}
                  render={({ field }) => (
                    <Box>
                      <Slider
                        {...field}
                        min={0}
                        max={10}
                        step={0.1}
                        marks={[
                          { value: 0, label: '0%' },
                          { value: 5, label: '5%' },
                          { value: 10, label: '10%' },
                        ]}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${value}%`}
                      />
                    </Box>
                  )}
                />
              </Box>

              {/* Price Estimate */}
              {estimate && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="medium" gutterBottom>
                      Estimate
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Entry Price
                      </Typography>
                      <Typography variant="caption">
                        {(estimate.estimatedPrice * 100).toFixed(2)}%
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Price Impact
                      </Typography>
                      <Typography variant="caption" color={estimate.priceImpact > 5 ? 'warning.main' : 'text.primary'}>
                        {estimate.priceImpact.toFixed(2)}%
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Potential Payout
                      </Typography>
                      <Typography variant="caption" fontWeight="medium">
                        {estimate.potentialPayout.toFixed(2)} DUST
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">
                        Potential Profit
                      </Typography>
                      <Typography
                        variant="caption"
                        fontWeight="medium"
                        color={estimate.potentialProfit > 0 ? 'success.main' : 'error.main'}
                      >
                        {estimate.potentialProfit > 0 ? '+' : ''}
                        {estimate.potentialProfit.toFixed(2)} DUST
                      </Typography>
                    </Box>
                  </Box>

                  {estimate.priceImpact > 5 && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      High price impact! Consider reducing your bet size.
                    </Alert>
                  )}
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
            {isSubmitting ? 'Placing Bet...' : 'Place Bet'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
