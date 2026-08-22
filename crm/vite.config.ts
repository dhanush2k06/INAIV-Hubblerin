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
  },
})
