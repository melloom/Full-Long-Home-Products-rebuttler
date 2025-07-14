import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    target: 'esnext', // Target modern browsers that support top-level await
    rollupOptions: {
      external: []
    }
  }
})