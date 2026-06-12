import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-utils': ['lucide-react', 'sweetalert2', 'axios', 'aos'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api-marketplace': {
        target: 'https://api-marketplace.anandamcomputer.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-marketplace/, ''),
        headers: {
          'Origin': 'https://api-marketplace.anandamcomputer.com',
        },
      },
      '/api-tracking': {
        target: 'https://api.anandamcomputer.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-tracking/, ''),
        headers: {
          'Origin': 'https://api.anandamcomputer.com',
        },
      },
    },
  },
});