import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss({ config: './tailwind.config.js' }),
  ],
  server: {
    port: 3000,
    hmr: {
      timeout: 5000,
      overlay: true
    },
    watch: {
      usePolling: true,
      interval: 1000
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    },
    extensions: ['.js', '.jsx', '.json']
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          pdfjs: ['pdfjs-dist'],
          'pdf-worker': ['pdfjs-dist/build/pdf.worker.min.js']
        }
      }
    }
  },
  base: "/",
  optimizeDeps: {
    include: [
      'react-pdf',
      'pdfjs-dist',
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'react-dropzone',
      'lucide-react',
      'prop-types',
      'date-fns'
    ],
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    deps: {
      optimizer: {
        web: {
          include: ['react-router-dom', 'react', 'react-dom'],
        },
      },
    },
    alias: {
      'react/jsx-runtime': 'react/jsx-runtime.js',
    },
  },
})