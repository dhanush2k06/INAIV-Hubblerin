import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The CRM is a separate, isolated app. It is deployed to its own URL/path
// so it is never bundled with the main user-facing HubblerX app.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      // Proxy API calls to the Express backend during development so the
      // browser never hits CORS (requests stay same-origin).
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    target: 'esnext',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react'
            }
            if (id.includes('recharts')) {
              return 'vendor-recharts'
            }
          }
        },
      },
    },
  },
})
