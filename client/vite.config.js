import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/multiplayer': { target: 'ws://localhost:5000', ws: true },
      '/api': 'http://localhost:5000',
    },
  },
})
