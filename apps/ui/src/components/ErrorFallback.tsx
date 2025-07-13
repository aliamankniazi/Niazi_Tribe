import { FallbackProps } from 'react-error-boundary';
import { Button, Container, Typography, Box } from '@mui/material';
import { RefreshRounded as RefreshIcon } from '@mui/icons-material';

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          gap: 2,
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Oops! Something went wrong
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          We're sorry, but something unexpected happened. Please try again.
        </Typography>

        {error.message && (
          <Typography
            variant="body2"
            sx={{
              p: 2,
              bgcolor: 'error.main',
              color: 'error.contrastText',
              borderRadius: 1,
              maxWidth: '100%',
              overflowX: 'auto',
            }}
          >
            {error.message}
          </Typography>
        )}

        <Button
          variant="contained"
          color="primary"
          onClick={resetErrorBoundary}
          startIcon={<RefreshIcon />}
          sx={{ mt: 2 }}
        >
          Try Again
        </Button>
      </Box>
    </Container>
  );
} 