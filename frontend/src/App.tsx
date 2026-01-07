import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { LoginPage } from './pages/LoginPage';
import { Layout } from './components/Layout';
import { useAuthStore } from './store/authStore';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy load dashboard (shared between roles)
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

// Lazy load puskesmas pages for code splitting
const LaporanPage = lazy(() => import('./pages/LaporanPage'));
const LaporanBulkInputPage = lazy(() => import('./pages/LaporanBulkInputPage'));
const CaraPengisianPage = lazy(() => import('./pages/CaraPengisianPage'));
const PuskesmasTargetKinerjaPage = lazy(() => import('./pages/PuskesmasTargetKinerjaPage'));

// Lazy load admin pages for code splitting
const AdminMasterDataPage = lazy(() => import('./pages/AdminMasterDataPage'));
const AdminKegiatanPage = lazy(() => import('./pages/AdminKegiatanPage'));
const AdminPuskesmasPage = lazy(() => import('./pages/AdminPuskesmasPage'));
const AdminLaporanSubKegiatanPage = lazy(() => import('./pages/AdminLaporanSubKegiatanPage'));
const AdminLaporanSumberAnggaranPage = lazy(() => import('./pages/AdminLaporanSumberAnggaranPage'));
const AdminPuskesmasConfigPage = lazy(() => import('./pages/AdminPuskesmasConfigPage'));
const AdminTargetPage = lazy(() => import('./pages/AdminTargetPage'));
const AdminTargetKinerjaPage = lazy(() => import('./pages/AdminTargetKinerjaPage'));
const AdminAngkasUploadPage = lazy(() => import('./pages/AdminAngkasUploadPage'));

// Loading fallback component
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" />
  </div>
);

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Puskesmas only route
const PuskesmasRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'puskesmas') return <Navigate to="/laporan" replace />;
  return <>{children}</>;
};

// Admin only route
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/laporan" replace />;
  return <>{children}</>;
};

// Root redirect component
const RootRedirect = () => {
  const { user } = useAuthStore();
  const redirectTo = user?.role === 'admin' ? '/dashboard' : '/laporan';
  return <Navigate to={redirectTo} replace />;
};

// Wrapper for lazy loaded pages
const PageWrapper = ({ component: Component, layout = true }: { component: React.ComponentType, layout?: boolean }) => {
  const content = (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );

  return layout ? <Layout>{content}</Layout> : content;
};

function App() {
  return (
    <BrowserRouter basename="/e-evkin">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RootRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <AdminRoute>
              <PageWrapper component={DashboardPage} />
            </AdminRoute>
          }
        />
        <Route
          path="/laporan"
          element={
            <PuskesmasRoute>
              <PageWrapper component={LaporanBulkInputPage} />
            </PuskesmasRoute>
          }
        />
        <Route
          path="/laporan-old"
          element={
            <PuskesmasRoute>
              <PageWrapper component={LaporanPage} />
            </PuskesmasRoute>
          }
        />
        <Route
          path="/cara-pengisian"
          element={
            <PuskesmasRoute>
              <PageWrapper component={CaraPengisianPage} />
            </PuskesmasRoute>
          }
        />
        <Route
          path="/target-kinerja"
          element={
            <PuskesmasRoute>
              <PageWrapper component={PuskesmasTargetKinerjaPage} />
            </PuskesmasRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/master-data"
          element={
            <AdminRoute>
              <PageWrapper component={AdminMasterDataPage} />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/kegiatan"
          element={
            <AdminRoute>
              <PageWrapper component={AdminKegiatanPage} />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/puskesmas"
          element={
            <AdminRoute>
              <PageWrapper component={AdminPuskesmasPage} />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/puskesmas-config"
          element={
            <AdminRoute>
              <PageWrapper component={AdminPuskesmasConfigPage} />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/laporan-sub-kegiatan"
          element={
            <AdminRoute>
              <PageWrapper component={AdminLaporanSubKegiatanPage} />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/laporan-sumber-anggaran"
          element={
            <AdminRoute>
              <PageWrapper component={AdminLaporanSumberAnggaranPage} />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/target"
          element={
            <AdminRoute>
              <PageWrapper component={AdminTargetPage} />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/target-kinerja"
          element={
            <AdminRoute>
              <PageWrapper component={AdminTargetKinerjaPage} />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/angkas"
          element={
            <AdminRoute>
              <PageWrapper component={AdminAngkasUploadPage} />
            </AdminRoute>
          }
        />

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
