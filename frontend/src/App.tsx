import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { LoginPage } from './pages/LoginPage';
import { Layout } from './components/Layout';
import { useAuthStore } from './store/authStore';

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
    <Spin size="large" tip="Loading..." />
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
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <DashboardPage />
                </Suspense>
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/laporan"
          element={
            <PuskesmasRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <LaporanBulkInputPage />
                </Suspense>
              </Layout>
            </PuskesmasRoute>
          }
        />
        <Route
          path="/laporan-old"
          element={
            <PuskesmasRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <LaporanPage />
                </Suspense>
              </Layout>
            </PuskesmasRoute>
          }
        />
        <Route
          path="/cara-pengisian"
          element={
            <PuskesmasRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <CaraPengisianPage />
                </Suspense>
              </Layout>
            </PuskesmasRoute>
          }
        />
        <Route
          path="/target-kinerja"
          element={
            <PuskesmasRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <PuskesmasTargetKinerjaPage />
                </Suspense>
              </Layout>
            </PuskesmasRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/master-data"
          element={
            <AdminRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <AdminMasterDataPage />
                </Suspense>
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/kegiatan"
          element={
            <AdminRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <AdminKegiatanPage />
                </Suspense>
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/puskesmas"
          element={
            <AdminRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <AdminPuskesmasPage />
                </Suspense>
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/puskesmas-config"
          element={
            <AdminRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <AdminPuskesmasConfigPage />
                </Suspense>
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/laporan-sub-kegiatan"
          element={
            <AdminRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <AdminLaporanSubKegiatanPage />
                </Suspense>
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/laporan-sumber-anggaran"
          element={
            <AdminRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <AdminLaporanSumberAnggaranPage />
                </Suspense>
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/target"
          element={
            <AdminRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <AdminTargetPage />
                </Suspense>
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/target-kinerja"
          element={
            <AdminRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <AdminTargetKinerjaPage />
                </Suspense>
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/angkas"
          element={
            <AdminRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <AdminAngkasUploadPage />
                </Suspense>
              </Layout>
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
