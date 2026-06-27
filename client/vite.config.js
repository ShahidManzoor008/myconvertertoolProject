import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss({ config: './tailwind.config.js' }),
  ],
  server: {
    port: 5173,
    host: 'localhost',
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Access-Control-Allow-Origin': '*',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req && req.method && req.url) console.log('Sending Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            if (req && req.url) console.log('Received Response:', proxyRes && proxyRes.statusCode, req.url);
          });
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src',
    },
    // Dedupe React to avoid multiple copies being loaded by the optimizer
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
    extensions: ['.js', '.jsx', '.json']
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('pdfjs-dist/build/pdf.worker.min.mjs')) return 'pdf-worker';
          if (id.includes('pdfjs-dist') || id.includes('react-pdf') || id.includes('pdf-lib')) return 'pdf-tools';
          if (id.includes('react-syntax-highlighter') || id.includes('prismjs') || id.includes('js-beautify')) return 'code-tools';
          if (id.includes('qrcode.react')) return 'qr-tools';
          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('@heroicons') || id.includes('lucide-react') || id.includes('react-icons')) return 'icons';
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'react-vendor';
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
        '.js': 'jsx',
        '.jsx': 'jsx' // Explicitly handle .jsx files as JSX
      },
      target: 'es2022' // Add this line to set the target environment
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    // Ensure Vitest bundles these deps so a single React instance is used
    server: {
      deps: {
        inline: ['react', 'react-dom', 'react/jsx-runtime', 'react-router-dom'],
      }
    },
    deps: {
      optimizer: {
        web: {
          include: ['react-router-dom', 'react', 'react-dom', 'react/jsx-runtime'],
        },
      },
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})