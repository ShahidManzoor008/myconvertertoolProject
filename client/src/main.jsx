import { initialPageLoader } from './config/pageLoaders';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './providers/AuthProvider.jsx' // Import AuthProvider
import ToastProvider from './components/Toast.jsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { initializePwa } from './utils/pwaInstall';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
initializePwa();

async function startApp() {
  await initialPageLoader(window.location.pathname)();
  document.head.querySelectorAll('[data-initial-seo], [data-rh]').forEach(element => element.remove());
  createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
}
startApp().catch(error => {
  console.error('Unable to start the app:', error);
  const notice = document.createElement('p');
  notice.setAttribute('role', 'alert');
  notice.textContent = 'Interactive tools could not load. Please reload this page to try again.';
  notice.style.cssText = 'padding:1rem;text-align:center;background:#fff7ed;color:#9a3412';
  document.body.prepend(notice);
});
