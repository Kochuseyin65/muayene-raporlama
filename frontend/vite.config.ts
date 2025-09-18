import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // Allow access over the machine's public IP
  server: {
    host: true, // listen on 0.0.0.0
    port: 5173,
  },
  preview: {
    host: true,
    port: 5173,
  },
})
