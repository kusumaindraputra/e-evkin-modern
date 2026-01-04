import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LaporanPage } from './pages/LaporanPage';
import { LaporanBulkInputPage } from './pages/LaporanBulkInputPage';
import { CaraPengisianPage } from './pages/CaraPengisianPage';
import { PuskesmasTargetKinerjaPage } from './pages/PuskesmasTargetKinerjaPage';
import { Layout } from './components/Layout';
import { useAuthStore } from './store/authStore';

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
                <DashboardPage />
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/laporan"
          element={
            <PuskesmasRoute>
              <Layout>
                <LaporanBulkInputPage />
              </Layout>
            </PuskesmasRoute>
          }
        />
        <Route
          path="/laporan-old"
          element={
            <PuskesmasRoute>
              <Layout>
                <LaporanPage />
              </Layout>
            </PuskesmasRoute>
          }
        />
        <Route
          path="/cara-pengisian"
          element={
            <PuskesmasRoute>
              <Layout>
                <CaraPengisianPage />
              </Layout>
            </PuskesmasRoute>
          }
        />
        <Route
          path="/target-kinerja"
          element={
            <PuskesmasRoute>
              <Layout>
                <PuskesmasTargetKinerjaPage />
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
