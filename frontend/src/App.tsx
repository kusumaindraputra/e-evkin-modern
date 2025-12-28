import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { LoginPage } from './pages/LoginPage';
import { Layout } from './components/Layout';
import { useAuthStore } from './store/authStore';

// Lazy load page components for code splitting
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const LaporanPage = lazy(() => import('./pages/LaporanPage').then(m => ({ default: m.LaporanPage })));
const LaporanBulkInputPage = lazy(() => import('./pages/LaporanBulkInputPage').then(m => ({ default: m.LaporanBulkInputPage })));
const AdminMasterDataPage = lazy(() => import('./pages/AdminMasterDataPage').then(m => ({ default: m.AdminMasterDataPage })));
const AdminKegiatanPage = lazy(() => import('./pages/AdminKegiatanPage').then(m => ({ default: m.AdminKegiatanPage })));
const AdminPuskesmasPage = lazy(() => import('./pages/AdminPuskesmasPage').then(m => ({ default: m.AdminPuskesmasPage })));
const AdminLaporanSubKegiatanPage = lazy(() => import('./pages/AdminLaporanSubKegiatanPage').then(m => ({ default: m.AdminLaporanSubKegiatanPage })));
const AdminLaporanSumberAnggaranPage = lazy(() => import('./pages/AdminLaporanSumberAnggaranPage').then(m => ({ default: m.AdminLaporanSumberAnggaranPage })));
const AdminPuskesmasConfigPage = lazy(() => import('./pages/AdminPuskesmasConfigPage').then(m => ({ default: m.AdminPuskesmasConfigPage })));
const CaraPengisianPage = lazy(() => import('./pages/CaraPengisianPage').then(m => ({ default: m.CaraPengisianPage })));
const AdminTargetPage = lazy(() => import('./pages/AdminTargetPage'));
const AdminTargetKinerjaPage = lazy(() => import('./pages/AdminTargetKinerjaPage'));
const AdminAngkasUploadPage = lazy(() => import('./pages/AdminAngkasUploadPage'));
const PuskesmasTargetKinerjaPage = lazy(() => import('./pages/PuskesmasTargetKinerjaPage').then(m => ({ default: m.PuskesmasTargetKinerjaPage })));

// Loading fallback component
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" tip="Memuat halaman..." />
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
                <Suspense fallback={<PageLoader />}>
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
                <Suspense fallback={<PageLoader />}>
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
                <Suspense fallback={<PageLoader />}>
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
                <Suspense fallback={<PageLoader />}>
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
                <Suspense fallback={<PageLoader />}>
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
                <Suspense fallback={<PageLoader />}>
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
                <Suspense fallback={<PageLoader />}>
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
                <Suspense fallback={<PageLoader />}>
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
                <Suspense fallback={<PageLoader />}>
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
                <Suspense fallback={<PageLoader />}>
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
                <Suspense fallback={<PageLoader />}>
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
                <Suspense fallback={<PageLoader />}>
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
                <Suspense fallback={<PageLoader />}>
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
                <Suspense fallback={<PageLoader />}>
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
