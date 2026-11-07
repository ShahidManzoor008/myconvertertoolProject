import { pageLoaders } from './config/pageLoaders';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense, useEffect } from 'react';
import Layout from "./components/Layout";
import { routerConfig } from "./config/router.config";
import adminRoutes from './routes/adminRoutes';
import ErrorBoundary from './components/ErrorBoundary';
import { setupDefaultInterceptors } from './utils/interceptors';
import LoadingSpinner from './components/LoadingSpinner';

const Home = lazy(pageLoaders['/']);
const About = lazy(pageLoaders['/about']);
const Tools = lazy(pageLoaders['/tools']);
const Blog = lazy(pageLoaders['/blog']);
const BlogPost = lazy(pageLoaders['/blog/:slug']);
const DevTools = lazy(pageLoaders['/tools/dev']);
const TextTools = lazy(pageLoaders['/tools/text']);
const SEOTools = lazy(pageLoaders['/tools/seo']);
const JsonFormatter = lazy(pageLoaders['/tools/json-formatter']);
const Base64Tool = lazy(pageLoaders['/tools/base64-encoder']);
const UrlTool = lazy(pageLoaders['/tools/url-encoder']);
const MinifyBeautifyTool = lazy(pageLoaders['/tools/minify-beautify']);
const QrCodeTool = lazy(pageLoaders['/tools/qr-code-generator']);
const MetaTagPreview = lazy(pageLoaders['/tools/meta-tag-preview']);
const TextCaseTool = lazy(pageLoaders['/tools/text-case-converter']);
const WordCounterTool = lazy(pageLoaders['/tools/word-counter']);
const PdfConverter = lazy(pageLoaders['/tools/pdf-converter']);
const MarkdownToDocx = lazy(pageLoaders['/tools/markdown-to-docx']);
const Register = lazy(pageLoaders['/register']);
const Login = lazy(pageLoaders['/login']);
const Profile = lazy(pageLoaders['/profile']);
const PrivacyPolicy = lazy(pageLoaders['/privacy-policy']);
const TermsOfService = lazy(pageLoaders['/terms']);
const Contact = lazy(pageLoaders['/contact']);
const NotFound = lazy(pageLoaders['*']);

function App() {
  // Set up API interceptors
  useEffect(() => {
    setupDefaultInterceptors();
  }, []);

  return (
    <HelmetProvider>
      <ErrorBoundary>
        <Router {...routerConfig}>
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
                <Route path="/tools/meta-tag-preview" element={<MetaTagPreview />} />
                <Route path="/tools/text-case-converter" element={<TextCaseTool />} />
                <Route path="/tools/word-counter" element={<WordCounterTool />} />
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
