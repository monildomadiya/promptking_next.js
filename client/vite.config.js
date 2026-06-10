import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteCompression({ algorithm: 'gzip', ext: '.gz' }),
    viteCompression({ algorithm: 'brotliCompress', ext: '.br' })
  ],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Heavy admin-only libs — only loaded when admin visits /admin-secure
          if (
            id.includes('node_modules/recharts') ||
            id.includes('node_modules/@dnd-kit') ||
            id.includes('node_modules/@simplewebauthn') ||
            id.includes('node_modules/framer-motion')
          ) {
            return 'admin-heavy';
          }
        }
      }
    }
  }
})
