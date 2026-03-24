import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Markets } from './pages/Markets';
import { MarketDetail } from './pages/MarketDetail';
import { Portfolio } from './pages/Portfolio';
import { CreateMarket } from './pages/CreateMarket';

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
        </Route>
      </Routes>
    </Box>
  );
}

export default App;
