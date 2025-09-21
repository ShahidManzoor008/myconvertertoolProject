import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async";
import Layout from "./components/Layout";
import { routerConfig } from "./config/router.config";
import { lazy, Suspense } from 'react';
import AdminLayout from './components/admin/AdminLayout';
import { adminRoutes } from './routes/adminRoutes';

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Tools = lazy(() => import("./pages/Tools"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const DevTools = lazy(() => import('./pages/tools/DevTools'));
const TextTools = lazy(() => import('./pages/tools/TextTools'));
const SEOTools = lazy(() => import('./pages/tools/SEOTools'));
const ElectronicsTools = lazy(() => import('./pages/tools/ElectronicsTools'));
const AITools = lazy(() => import('./pages/tools/AITools'));
const JsonFormatter = lazy(() => import('./pages/tools/JsonFormatter'));
const Base64Tool = lazy(() => import('./pages/tools/Base64Tool'));
const UrlTool = lazy(() => import('./pages/tools/UrlTool'));
const MinifyBeautifyTool = lazy(() => import('./pages/tools/MinifyBeautifyTool'));
const QrCodeTool = lazy(() => import('./pages/tools/QrCodeTool'));
const TextCaseTool = lazy(() => import('./pages/tools/TextCaseTool'));
const PdfConverter = lazy(() => import('./pages/tools/PdfConverter'));
const MarkdownToDocx = lazy(() => import('./pages/tools/MarkdownToDocx'));
const PdfTools = lazy(() => import('./pages/tools/PdfTools'));

const Register = lazy(() => import('./pages/Register'));
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./pages/Profile'));
const PdfEditor = lazy(() => import('./pages/tools/PdfEditor')); // Import new PdfEditor

function App() {
  return (
  <HelmetProvider>
      <Helmet>
        <title>my converter tool - Free Developer & Productivity Tools</title>
        <meta name="description" content="A collection of free online tools for developers, text processing, and productivity." />
        <meta name="keywords" content="developer tools,free online tools,free pfd tools, free coding tools, SEO tools, text tools" />
        <meta property="og:title" content="SMS Coding Online - Free Developer & Productivity Tools" />
        <meta property="og:description" content="A collection of free online tools for developers, text processing, and productivity." />
        <meta property="og:url" content="https://myconvertertool.com/" />
        <meta property="og:type" content="website" />
      </Helmet>
    <Router {...routerConfig}>
      <Layout>
        <Suspense fallback={<div>Loading...</div>}>

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/tools/dev" element={<DevTools />} />
            <Route path="/tools/text" element={<TextTools />} />
            <Route path="/tools/seo" element={<SEOTools />} />
            <Route path="/tools/electronics" element={<ElectronicsTools />} />
            <Route path="/tools/ai" element={<AITools />} />
            <Route path="/tools/json-formatter" element={<JsonFormatter />} />
            <Route path="/tools/base64-encoder" element={<Base64Tool />} />
            <Route path="/tools/url-encoder" element={<UrlTool />} />
            <Route path="/tools/minify-beautify" element={<MinifyBeautifyTool />} />
            <Route path="/tools/qr-code-generator" element={<QrCodeTool />} />
            <Route path="/tools/text-case-converter" element={<TextCaseTool />} />
            <Route path="/tools/pdf-converter" element={<PdfConverter />} />
            <Route path="/tools/markdown-to-docx" element={<MarkdownToDocx />} />
            <Route path="/tools/pdf" element={<PdfTools />} />
            <Route path="/tools/pdf-editor" element={<PdfEditor />} />

            {/* Admin Routes */}
            {adminRoutes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <AdminLayout>
                    <Suspense fallback={<div>Loading...</div>}>
                      <route.element />
                    </Suspense>
                  </AdminLayout>
                }
              />
            ))}
          </Routes>
        </Suspense>
      </Layout>
    </Router>
    
  </HelmetProvider>
  );
}

export default App;
