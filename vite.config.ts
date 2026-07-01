import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React ecosystem
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router') || id.includes('node_modules/scheduler')) {
            return 'vendor-react';
          }

          // Large UI libraries - split each into its own chunk
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-lucide';
          }
          if (id.includes('node_modules/swiper')) {
            return 'vendor-swiper';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-framer';
          }
          if (id.includes('node_modules/recharts')) {
            return 'vendor-recharts';
          }
          if (id.includes('node_modules/react-quill') || id.includes('node_modules/react-quill-new')) {
            return 'vendor-quill';
          }
          if (id.includes('node_modules/react-pdf')) {
            return 'vendor-pdf';
          }
          if (id.includes('node_modules/react-pageflip')) {
            return 'vendor-pageflip';
          }
          if (id.includes('node_modules/emoji-picker-react')) {
            return 'vendor-emoji';
          }
          if (id.includes('node_modules/react-helmet-async')) {
            return 'vendor-helmet';
          }
          if (id.includes('node_modules/react-icons')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/@react-google-maps') || id.includes('node_modules/@react-oauth')) {
            return 'vendor-google';
          }
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) {
            return 'vendor-leaflet';
          }
          if (id.includes('node_modules/@heroicons/react')) {
            return 'vendor-heroicons';
          }

          // Data / HTTP / utility libraries
          if (id.includes('node_modules/axios')) {
            return 'vendor-axios';
          }
          if (id.includes('node_modules/sweetalert2')) {
            return 'vendor-swal';
          }
          if (id.includes('node_modules/socket.io')) {
            return 'vendor-socket';
          }
          if (id.includes('node_modules/recharts')) {
            return 'vendor-recharts';
          }
          if (id.includes('node_modules/jwt-decode')) {
            return 'vendor-jwt';
          }
          if (id.includes('node_modules/aos')) {
            return 'vendor-aos';
          }
          if (id.includes('node_modules/xmlbuilder2')) {
            return 'vendor-xml';
          }

          // Catch-all for other node_modules - split into multiple chunks by size
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
          return null;
        },
        // Further split vendor-misc if it exceeds 244kB
        experimentalMinChunkSize: 40 * 1024, // 40kB minimum chunk size
      },
    },
    chunkSizeWarningLimit: 400, // Allow up to 400kB before warning (emoji-picker is ~304kB, main app is ~362kB)
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Minify aggressively
    minify: 'esbuild',
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Reduce CSS size
    cssMinify: true,
    // Enable source maps only in dev
    sourcemap: false,
    // Optimize dependencies
    commonjsOptions: {
      include: [/node_modules/],
    },
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
        rewrite: (path: string) => path.replace(/^\/api-marketplace/, ''),
        headers: {
          'Origin': 'https://api-marketplace.anandamcomputer.com',
        },
      },
      '/api-tracking': {
        target: 'https://api.anandamcomputer.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => path.replace(/^\/api-tracking/, ''),
        headers: {
          'Origin': 'https://api.anandamcomputer.com',
        },
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    proxy: {
      '/api-marketplace': {
        target: 'https://api-marketplace.anandamcomputer.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => path.replace(/^\/api-marketplace/, ''),
        headers: {
          'Origin': 'https://api-marketplace.anandamcomputer.com',
        },
      },
      '/api-tracking': {
        target: 'https://api.anandamcomputer.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => path.replace(/^\/api-tracking/, ''),
        headers: {
          'Origin': 'https://api.anandamcomputer.com',
        },
      },
    },
  },
})