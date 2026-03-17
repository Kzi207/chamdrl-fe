import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  esbuild: {
    // drop: ['console', 'debugger'], // TẠM BỎ ĐỂ DEBUG GOOGLE LOGIN
    legalComments: 'none'
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: ["fme.kzii.site"],
    proxy: {
      '/admin-api': {
        target: 'https://database.kzii.site',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/admin-api/, '/admin-api')
      },
      '/drl_scores': {
        target: 'https://database.kzii.site',
        changeOrigin: true,
        secure: false
      },
      '/api': {
        target: 'https://database.kzii.site',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  preview: {
    port: 5173,
    host: true
  },
  build: {
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth'],
          'ui-vendor': ['lucide-react', 'recharts'],
          'pdf-vendor': ['jspdf'],
          'excel-vendor': ['xlsx'],
          'qr-vendor': ['qrcode', 'jsqr'],
          'zip-vendor': ['jszip']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    cssCodeSplit: true,
    assetsInlineLimit: 4096
  }
})