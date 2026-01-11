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
const PuskesmasTargetPage = lazy(() => import('./pages/PuskesmasTargetPage'));

// Lazy load admin pages for code splitting
const AdminMasterDataPage = lazy(() => import('./pages/AdminMasterDataPage'));
const AdminPuskesmasPage = lazy(() => import('./pages/AdminPuskesmasPage'));
const AdminPuskesmasConfigPage = lazy(() => import('./pages/AdminPuskesmasConfigPage'));
// Consolidated pages
const AdminTargetUploadPage = lazy(() => import('./pages/AdminTargetUploadPage'));
const AdminTargetEditPage = lazy(() => import('./pages/AdminTargetEditPage'));
const AdminLaporanPage = lazy(() => import('./pages/AdminLaporanPage'));

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
        {/* Consolidated Target & Angkas page */}
        <Route
          path="/target"
          element={
            <PuskesmasRoute>
              <PageWrapper component={PuskesmasTargetPage} />
            </PuskesmasRoute>
          }
        />
        {/* Legacy routes - redirect to new consolidated page */}
        <Route
          path="/target-kinerja"
          element={<Navigate to="/target?tab=target-kinerja" replace />}
        />
        <Route
          path="/angkas"
          element={<Navigate to="/target?tab=angkas" replace />}
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
        {/* Legacy kegiatan route - redirect to master-data */}
        <Route
          path="/admin/kegiatan"
          element={<Navigate to="/admin/master-data" replace />}
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
        {/* Consolidated Admin Laporan page */}
        <Route
          path="/admin/laporan"
          element={
            <AdminRoute>
              <PageWrapper component={AdminLaporanPage} />
            </AdminRoute>
          }
        />
        {/* Legacy laporan routes - redirect to new page */}
        <Route
          path="/admin/laporan-sub-kegiatan"
          element={<Navigate to="/admin/laporan" replace />}
        />
        <Route
          path="/admin/laporan-sumber-anggaran"
          element={<Navigate to="/admin/laporan" replace />}
        />
        {/* NEW: Consolidated Target & Angkas pages */}
        <Route
          path="/admin/target-upload"
          element={
            <AdminRoute>
              <PageWrapper component={AdminTargetUploadPage} />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/target-edit"
          element={
            <AdminRoute>
              <PageWrapper component={AdminTargetEditPage} />
            </AdminRoute>
          }
        />
        {/* Legacy routes - redirect to new pages */}
        <Route
          path="/admin/target"
          element={<Navigate to="/admin/target-upload" replace />}
        />
        <Route
          path="/admin/target-kinerja"
          element={<Navigate to="/admin/target-edit" replace />}
        />
        <Route
          path="/admin/angkas"
          element={<Navigate to="/admin/target-upload" replace />}
        />
        <Route
          path="/admin/angkas-manual"
          element={<Navigate to="/admin/target-edit" replace />}
        />

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
