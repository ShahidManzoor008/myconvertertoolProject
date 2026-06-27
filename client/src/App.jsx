import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense, useEffect } from 'react';
import Layout from "./components/Layout";
import { routerConfig } from "./config/router.config";
import adminRoutes from './routes/adminRoutes';
import ErrorBoundary from './components/ErrorBoundary';
import { setupDefaultInterceptors } from './utils/interceptors';
import LoadingSpinner from './components/LoadingSpinner';
import AdSenseScript from './components/AdSenseScript';

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Tools = lazy(() => import("./pages/Tools"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const DevTools = lazy(() => import('./pages/tools/DevTools'));
const TextTools = lazy(() => import('./pages/tools/TextTools'));
const SEOTools = lazy(() => import('./pages/tools/SEOTools'));
const JsonFormatter = lazy(() => import('./pages/tools/JsonFormatter'));
const Base64Tool = lazy(() => import('./pages/tools/Base64Tool'));
const UrlTool = lazy(() => import('./pages/tools/UrlTool'));
const MinifyBeautifyTool = lazy(() => import('./pages/tools/MinifyBeautifyTool'));
const QrCodeTool = lazy(() => import('./pages/tools/QrCodeTool'));
const TextCaseTool = lazy(() => import('./pages/tools/TextCaseTool'));
const PdfConverter = lazy(() => import('./pages/tools/PdfConverter'));
const MarkdownToDocx = lazy(() => import('./pages/tools/MarkdownToDocx'));
const Register = lazy(() => import('./pages/Register'));
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./pages/Profile'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const Contact = lazy(() => import('./pages/Contact'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  // Set up API interceptors
  useEffect(() => {
    setupDefaultInterceptors();
  }, []);

  return (
    <HelmetProvider>
      <ErrorBoundary>
        <Router {...routerConfig}>
          <AdSenseScript />
          <Layout>
            <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/tools" element={<Tools />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/tools/dev" element={<DevTools />} />
                <Route path="/tools/text" element={<TextTools />} />
                <Route path="/tools/seo" element={<SEOTools />} />
                <Route path="/tools/json-formatter" element={<JsonFormatter />} />
                <Route path="/tools/base64-encoder" element={<Base64Tool />} />
                <Route path="/tools/url-encoder" element={<UrlTool />} />
                <Route path="/tools/minify-beautify" element={<MinifyBeautifyTool />} />
                <Route path="/tools/qr-code-generator" element={<QrCodeTool />} />
                <Route path="/tools/text-case-converter" element={<TextCaseTool />} />
                <Route path="/tools/pdf-converter" element={<PdfConverter />} />
                <Route path="/tools/markdown-to-docx" element={<MarkdownToDocx />} />
                <Route path="/tools/pdf" element={<Navigate replace to="/tools/pdf-converter" />} />
                <Route path="/tools/pdf-editor" element={<Navigate replace to="/tools/pdf-converter" />} />
                {/* Admin Routes */}
                {adminRoutes}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Layout>
        </Router>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;