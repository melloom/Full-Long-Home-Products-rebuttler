import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig({
  base: '/', // Use root base for absolute paths
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        // Add autoprefixer and other CSS processing
      ]
    },
    minify: false // Disable CSS minification to avoid syntax errors
  },
  server: {
    port: 3002,
    strictPort: false,
    hmr: {
      port: 5175,
      overlay: true
    },
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    }
  },
  publicDir: 'public',
  resolve: {
    extensions: ['.js', '.jsx', '.json']
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    cssCodeSplit: false, // Prevent CSS splitting issues
    target: 'esnext', // Target modern browsers that support top-level await
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    'process.platform': JSON.stringify(process.platform),
    'process.version': JSON.stringify(process.version),
    'process.stdout': {
      isTTY: false
    },
    'process.stderr': {
      isTTY: false
    }
  }
})