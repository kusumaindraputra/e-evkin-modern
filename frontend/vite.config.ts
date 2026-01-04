import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/e-evkin/',
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
          'vendor-antd': ['antd'],
          'vendor-axios': ['axios'],
          'vendor-zustand': ['zustand'],
          
          // Admin pages chunk (lazy loaded)
          'admin-pages': [
            './src/pages/AdminMasterDataPage.tsx',
            './src/pages/AdminKegiatanPage.tsx',
            './src/pages/AdminPuskesmasPage.tsx',
            './src/pages/AdminLaporanSubKegiatanPage.tsx',
            './src/pages/AdminLaporanSumberAnggaranPage.tsx',
            './src/pages/AdminPuskesmasConfigPage.tsx',
            './src/pages/AdminTargetPage.tsx',
            './src/pages/AdminTargetKinerjaPage.tsx',
            './src/pages/AdminAngkasUploadPage.tsx',
          ],
        },
      },
    },
    // Increase chunk size warning limit temporarily (will optimize further)
    chunkSizeWarningLimit: 1000,
  },
})

