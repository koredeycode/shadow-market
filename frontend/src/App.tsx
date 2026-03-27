import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Layout } from './components/layout/Layout';

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Markets = lazy(() => import('./pages/Markets'));
const MarketDetail = lazy(() => import('./pages/MarketDetail'));
const CreateMarket = lazy(() => import('./pages/CreateMarket'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Analytics = lazy(() => import('./pages/Analytics'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex justify-center items-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-blue"></div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-obsidian text-slate-200">
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

export default App;
