/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Manual chunk configuration for optimal code splitting
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-antd': ['antd', '@ant-design/icons'],
          'vendor-axios': ['axios'],
          'vendor-zustand': ['zustand'],
          'vendor-charts': ['recharts'],

          // Puskesmas pages chunk (lazy loaded)
          'puskesmas-pages': [
            './src/pages/LaporanBulkInputPage.tsx',
            './src/pages/CaraPengisianPage.tsx',
            './src/pages/PuskesmasTargetPage.tsx',
            './src/pages/PuskesmasTargetKinerjaPage.tsx',
            './src/pages/PuskesmasAngkasPage.tsx',
            './src/pages/PuskesmasDashboardPage.tsx',
          ],

          // Admin pages chunk (lazy loaded)
          'admin-pages': [
            './src/pages/AdminMasterDataPage.tsx',
            './src/pages/AdminPuskesmasPage.tsx',
            './src/pages/AdminPuskesmasConfigPage.tsx',
            './src/pages/AdminTargetUploadPage.tsx',
            './src/pages/AdminTargetEditPage.tsx',
            './src/pages/AdminLaporanPage.tsx',
            './src/pages/DashboardPage.tsx',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
  test: {
    globals: true,
    environment: 'node',
    // setupFiles: './src/setupTests.ts',
  },
})

