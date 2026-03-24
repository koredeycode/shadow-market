import { Box } from '@mui/material';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Analytics } from './pages/Analytics';
import { CreateMarket } from './pages/CreateMarket';
import { Home } from './pages/Home';
import { MarketDetail } from './pages/MarketDetail';
import { Markets } from './pages/Markets';
import { Portfolio } from './pages/Portfolio';

function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="markets" element={<Markets />} />
          <Route path="markets/:id" element={<MarketDetail />} />
          <Route path="markets/create" element={<CreateMarket />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </Box>
  );
}

export default App;
