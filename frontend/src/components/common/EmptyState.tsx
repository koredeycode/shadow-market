import { Box, Button, Typography } from '@mui/material';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
        gap: 2.5,
        p: 4,
        borderRadius: 3,
        border: '2px dashed rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
      }}
      role="status"
      aria-label={title}
    >
      {icon && (
        <Box
          sx={{
            fontSize: 64,
            color: 'text.secondary',
            mb: 1,
            opacity: 0.5,
            filter: 'grayscale(0.3)',
          }}
        >
          {icon}
        </Box>
      )}
      <Typography variant="h5" color="text.primary" fontWeight={600}>
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body1"
          color="text.secondary"
          textAlign="center"
          maxWidth={480}
          sx={{ lineHeight: 1.7 }}
        >
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="contained" size="large" onClick={onAction} sx={{ mt: 2 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
