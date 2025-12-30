import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@data': path.resolve(__dirname, './src/data'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2018', // Modern browsers for better performance
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React and core libraries
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
            return 'react-vendor'
          }
          // UI libraries
          if (id.includes('lucide-react')) {
            return 'icons'
          }
          // PDF processing
          if (id.includes('pdfjs-dist')) {
            return 'pdf-processor'
          }
          // Database and utilities
          if (id.includes('dexie') || id.includes('fuse.js') || id.includes('lz-string')) {
            return 'utils'
          }
          // Everything else
          return 'vendor'
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk'
          return `assets/[name]-[hash].js`
        },
      },
    },
    chunkSizeWarningLimit: 500, // Smaller chunks for better caching
  },
  server: {
    port: 5173,
    open: true,
    // Enable HMR optimizations
    hmr: {
      overlay: true
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
    exclude: ['pdfjs-dist'] // PDF.js can cause issues with pre-bundling
  },
  // Enable better source maps for development
  css: {
    devSourcemap: true
  }
})
