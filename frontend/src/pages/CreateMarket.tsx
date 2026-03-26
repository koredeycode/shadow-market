import { Construction } from '@mui/icons-material';
import { Box, Card, CardContent, Container, Typography } from '@mui/material';

export function CreateMarket() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <Typography
        variant="h3"
        sx={{
          mb: 2,
          fontWeight: 700,
          fontSize: { xs: '2rem', md: '2.5rem' },
        }}
      >
        Create Market
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 5, fontSize: '1.1rem' }}>
        Design and launch your own prediction market
      </Typography>

      <Card
        sx={{
          borderRadius: 3,
          border: '2px dashed rgba(255, 255, 255, 0.2)',
          bgcolor: 'rgba(255, 255, 255, 0.02)',
          minHeight: 400,
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 350,
              gap: 3,
            }}
          >
            <Box
              sx={{
                p: 3,
                borderRadius: '50%',
                bgcolor: 'rgba(124, 58, 237, 0.15)',
              }}
            >
              <Construction sx={{ fontSize: 64, color: 'primary.main' }} />
            </Box>
            <Typography variant="h5" fontWeight={600} textAlign="center">
              Market Creation Coming Soon
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              textAlign="center"
              maxWidth={500}
              sx={{ lineHeight: 1.7 }}
            >
              The market creation interface will be available in the next phase. You'll be able to
              create custom prediction markets with configurable parameters, outcomes, and
              resolution criteria.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}

export default CreateMarket;
