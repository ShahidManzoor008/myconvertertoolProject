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
      'Cross-Origin-Opener-Policy': 'unsafe-none',
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
      // Ensure tooling (Vitest/Vite) resolves React to the client's node_modules
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom')
    },
    // Dedupe React to avoid multiple copies being loaded by the optimizer
    dedupe: ['react', 'react-dom'],
    extensions: ['.js', '.jsx', '.json']
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          pdfjs: ['pdfjs-dist'],
          // Use the ESM worker path (.mjs) so Rollup can resolve it at build time
          'pdf-worker': ['pdfjs-dist/build/pdf.worker.min.mjs']
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
        inline: ['react', 'react-dom', 'react-router-dom'],
      }
    },
    deps: {
      optimizer: {
        web: {
          include: ['react-router-dom', 'react', 'react-dom'],
        },
      },
    },
    alias: {
      'react/jsx-runtime': path.resolve(__dirname, './node_modules/react/jsx-runtime.js'),
      // Ensure tests resolve React to the client's node_modules
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      'react-dom/client': path.resolve(__dirname, './node_modules/react-dom/client.js')
    },
  },
})