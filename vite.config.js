import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  root: 'admin-ui',
  build: {
    outDir: '../public/admin-dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/widget.js': 'http://localhost:3000',
      '/preview': 'http://localhost:3000',
    }
  }
})
