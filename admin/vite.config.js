import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@brand': path.resolve(__dirname, '../shared/brand.config.js'),
    },
  },
  server: {
    port: 5174,
    fs: { allow: ['..'] },
  },
})
