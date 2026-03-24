import { Alert, Box, Button, Container, Typography } from '@mui/material';
import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              gap: 3,
            }}
          >
            <Typography variant="h3" component="h1" gutterBottom>
              Oops! Something went wrong
            </Typography>
            <Alert severity="error" sx={{ width: '100%', maxWidth: 600 }}>
              <Typography variant="body1" gutterBottom>
                {this.state.error?.message || 'An unexpected error occurred'}
              </Typography>
            </Alert>
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <Box
                component="pre"
                sx={{
                  width: '100%',
                  maxWidth: 600,
                  p: 2,
                  bgcolor: 'grey.900',
                  color: 'grey.100',
                  borderRadius: 1,
                  overflow: 'auto',
                  maxHeight: 300,
                  fontSize: '0.875rem',
                }}
              >
                {this.state.errorInfo.componentStack}
              </Box>
            )}
            <Button variant="contained" onClick={this.handleReset} size="large" sx={{ mt: 2 }}>
              Go to Home
            </Button>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}
