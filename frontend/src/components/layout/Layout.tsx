import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export function Layout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box component="main" sx={{ flex: 1, pt: 2, pb: 4 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
