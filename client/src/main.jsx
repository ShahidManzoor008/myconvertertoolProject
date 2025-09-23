import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './providers/AuthProvider.jsx' // Import AuthProvider
import ToastProvider from './components/Toast.jsx'
import { pdfjs } from 'react-pdf';

// Point the worker to the ESM build provided by pdfjs-dist (uses .mjs)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  '/pdf.worker.min.js',
  import.meta.url,
).toString();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </StrictMode>,
)