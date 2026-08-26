import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { CreateListingPage } from './pages/CreateListingPage';
import { CreatePoolPage } from './pages/CreatePoolPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';
import { ExplorerPage } from './pages/ExplorerPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-graphite-900">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/marketplace/:id" element={<ListingDetailPage />} />
          <Route path="/explorer" element={<ExplorerPage />} />
          <Route path="/explorer/:hash" element={<ExplorerPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/listings/new"
            element={
              <ProtectedRoute roles={['farmer', 'cooperative']}>
                <CreateListingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pools/new"
            element={
              <ProtectedRoute roles={['cooperative', 'admin']}>
                <CreatePoolPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
