import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LaporanPage } from './pages/LaporanPage';
import { LaporanBulkInputPage } from './pages/LaporanBulkInputPage';
import AdminVerifikasiPage from './pages/AdminVerifikasiPage';
import { AdminLaporanDetailPage } from './pages/AdminLaporanDetailPage';
import { AdminMasterDataPage } from './pages/AdminMasterDataPage';
import { AdminPuskesmasPage } from './pages/AdminPuskesmasPage';
import { AdminLaporanSubKegiatanPage } from './pages/AdminLaporanSubKegiatanPage';
import { AdminLaporanSumberAnggaranPage } from './pages/AdminLaporanSumberAnggaranPage';
import { AdminPuskesmasConfigPage } from './pages/AdminPuskesmasConfigPage';
import { CaraPengisianPage } from './pages/CaraPengisianPage';
import { Layout } from './components/Layout';
import { useAuthStore } from './store/authStore';

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Puskesmas only route
const PuskesmasRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'puskesmas') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

// Admin only route
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
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

        {/* Admin routes */}
        <Route
          path="/admin/verifikasi"
          element={
            <AdminRoute>
              <Layout>
                <AdminVerifikasiPage />
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/master-data"
          element={
            <AdminRoute>
              <Layout>
                <AdminMasterDataPage />
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/puskesmas"
          element={
            <AdminRoute>
              <Layout>
                <AdminPuskesmasPage />
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/puskesmas-config"
          element={
            <AdminRoute>
              <Layout>
                <AdminPuskesmasConfigPage />
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/laporan-sub-kegiatan"
          element={
            <AdminRoute>
              <Layout>
                <AdminLaporanSubKegiatanPage />
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/laporan-sumber-anggaran"
          element={
            <AdminRoute>
              <Layout>
                <AdminLaporanSumberAnggaranPage />
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/laporan/:userId/:bulan/:tahun"
          element={
            <AdminRoute>
              <Layout>
                <AdminLaporanDetailPage />
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
