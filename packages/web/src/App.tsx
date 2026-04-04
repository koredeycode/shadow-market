import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Layout } from './components/layout/Layout';
import { Toaster } from 'react-hot-toast';

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Markets = lazy(() => import('./pages/Markets'));
const MarketDetail = lazy(() => import('./pages/MarketDetail'));
const CreateMarket = lazy(() => import('./pages/CreateMarket'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const NotFound = lazy(() => import('./pages/NotFound'));
const LinkCLI = lazy(() => import('./pages/auth/LinkCLI'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminMarkets = lazy(() => import('./pages/admin/Markets'));
const AdminContractState = lazy(() => import('./pages/admin/ContractState'));

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
              <Route path="markets/create" element={<CreateMarket />} />
              <Route path="markets/:slug" element={<MarketDetail />} />
              <Route path="markets/:slug/wagers" element={<MarketDetail />} />
              <Route path="portfolio" element={<Portfolio />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="terms" element={<Terms />} />
              <Route path="how-it-works" element={<HowItWorks />} />
              <Route path="auth/link" element={<LinkCLI />} />

              {/* Admin Routes */}
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/market" element={<AdminMarkets />} />
              <Route path="admin/contract-state" element={<AdminContractState />} />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
        <Toaster 
          position="bottom-right"
          containerStyle={{ zIndex: 99999 }}
          toastOptions={{
            duration: 5000,
            style: {
              background: '#0F172A',
              color: '#F1F5F9',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '2px',
              fontSize: '12px',
              fontFamily: 'monospace',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#0F172A',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#0F172A',
              },
            },
          }}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
