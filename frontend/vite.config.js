import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// In development, Vite forwards /api calls to the Express server.
// In production, Nginx does the same job (guide 4.3), so the frontend
// code always calls the relative path /api and never changes.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:5000' },
  },
})
