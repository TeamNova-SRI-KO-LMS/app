import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Proxy /uploads to the backend from VITE_API_URL (without the /api prefix).
  const env = loadEnv(mode, import.meta.dirname)
  const backendUrl = (env.VITE_API_URL || 'http://localhost:5000/api')
    .replace(/\/+$/, '')
    .replace(/\/api$/, '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/uploads': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  }
})
