import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0', // Allow external connections
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
    allowedHosts: ['localhost', 'frontend', '127.0.0.1'],
  },
  define: {
    'process.env.API_URL': JSON.stringify('http://localhost:5000'),
  },
})
