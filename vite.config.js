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
    minify: 'terser',
    target: 'es2018',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      format: {
        comments: false,
      },
    },
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
          // Data files - separate chunk
          if (id.includes('/src/data/')) {
            return 'data'
          }
          // Hooks - utilities chunk
          if (id.includes('/src/hooks/')) {
            return 'hooks'
          }
          // Database and utilities
          if (id.includes('dexie') || id.includes('fuse.js') || id.includes('lz-string')) {
            return 'utils'
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 400,
  },
  server: {
    port: 5174,
    strictPort: true,
    open: false,
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
