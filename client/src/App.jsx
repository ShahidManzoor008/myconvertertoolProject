import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Layout from "./components/Layout"; // Ensure this path is correct

import Home from "./pages/Home";
import About from "./pages/About";
import Tools from "./pages/Tools";
import Blog from "./pages/Blog"; 
import BlogPost from "./pages/BlogPost";
import DevTools from "./pages/tools/DevTools";
import TextTools from "./pages/tools/TextTools";
import SEOTools from "./pages/tools/SEOTools";
import ElectronicsTools from "./pages/tools/ElectronicsTools";
import AITools from "./pages/tools/AITools";
import JsonFormatter from "./pages/tools/JsonFormatter";
import Base64Tool from "./pages/tools/Base64Tool";
import UrlTool from "./pages/tools/UrlTool";
import MinifyBeautifyTool from "./pages/tools/MinifyBeautifyTool";
import QrCodeTool from "./pages/tools/QrCodeTool";
import TextCaseTool from "./pages/tools/TextCaseTool";
import PdfConverter from "./pages/tools/PdfConverter";
import MarkdownToDocx from "./pages/tools/MarkdownToDocx";
import PdfTools from "./pages/tools/PdfTools";
import { Helmet } from "react-helmet-async";
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
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogPost />} />
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
        </Routes>
      </Layout>
    </Router>
  </HelmetProvider>
  );
}

export default App;
