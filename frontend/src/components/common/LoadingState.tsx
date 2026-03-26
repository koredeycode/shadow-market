import { Box, CircularProgress, Typography, keyframes } from '@mui/material';

interface LoadingStateProps {
  message?: string;
  size?: number;
}

const pulse = keyframes`
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
`;

export function LoadingState({ message = 'Loading...', size = 40 }: LoadingStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
        gap: 2.5,
      }}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <Box
        sx={{
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: -8,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124, 58, 237, 0.2) 0%, transparent 70%)',
            animation: `${pulse} 2s ease-in-out infinite`,
          },
        }}
      >
        <CircularProgress size={size} thickness={3.5} />
      </Box>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontWeight: 500, animation: `${pulse} 2s ease-in-out infinite` }}
      >
        {message}
      </Typography>
    </Box>
  );
}
