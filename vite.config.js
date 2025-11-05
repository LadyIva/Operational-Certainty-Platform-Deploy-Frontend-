// vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy all requests starting with /api to your local Flask server
      '/api': {
        target: 'http://localhost:5000', // Change this to your local Flask port if different
        changeOrigin: true,
        secure: false,
        // Rewrite the path if necessary, but Flask is already expecting /api/dashboard
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})