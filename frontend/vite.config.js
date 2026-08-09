import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/my-app/',
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      // Matches the /my-app/api/* path the app actually requests
      // (using Vite's BASE_URL), then strips the application prefix
      // before forwarding, since the backend itself only knows about
      // /api/*, not the frontend application's /my-app/ prefix.
      '/my-app/api': {
        target: 'http://127.0.0.1:3002',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/my-app/, '')
      }
    }
  }
})