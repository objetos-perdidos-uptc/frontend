import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// El frontend llama a /api/... y Vite lo reenvía al API Gateway (8080) quitando el prefijo /api.
// Ej: /api/claims/me  ->  http://localhost:8080/claims/me
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
