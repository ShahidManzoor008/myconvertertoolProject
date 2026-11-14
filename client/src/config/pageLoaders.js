export const pageLoaders = {
  '/': () => import('../pages/Home'),
  '/about': () => import('../pages/About'),
  '/tools': () => import('../pages/Tools'),
  '/blog': () => import('../pages/Blog'),
  '/blog/:slug': () => import('../pages/BlogPost'),
  '/tools/dev': () => import('../pages/tools/DevTools'),
  '/tools/text': () => import('../pages/tools/TextTools'),
  '/tools/seo': () => import('../pages/tools/SEOTools'),
  '/tools/json-formatter': () => import('../pages/tools/JsonFormatter'),
  '/tools/base64-encoder': () => import('../pages/tools/Base64Tool'),
  '/tools/url-encoder': () => import('../pages/tools/UrlTool'),
  '/tools/minify-beautify': () => import('../pages/tools/MinifyBeautifyTool'),
  '/tools/qr-code-generator': () => import('../pages/tools/QrCodeTool'),
  '/tools/meta-tag-preview': () => import('../pages/tools/MetaTagPreview'),
  '/tools/text-case-converter': () => import('../pages/tools/TextCaseTool'),
  '/tools/word-counter': () => import('../pages/tools/WordCounterTool'),
  '/tools/pdf-converter': () => import('../pages/tools/PdfConverter'),
  '/tools/file-compressor': () => import('../pages/tools/FileCompressor'),
  '/tools/excel-pdf': () => import('../pages/tools/ExcelPdfConverter'),
  '/tools/markdown-to-docx': () => import('../pages/tools/MarkdownToDocx'),
  '/register': () => import('../pages/Register'),
  '/login': () => import('../pages/Login'),
  '/profile': () => import('../pages/Profile'),
  '/privacy-policy': () => import('../pages/PrivacyPolicy'),
  '/terms': () => import('../pages/TermsOfService'),
  '/contact': () => import('../pages/Contact'),
  '*': () => import('../pages/NotFound'),
};

export const initialPageLoader = pathname => {
  const route = pathname.replace(/\/+$/, "") || "/";
  return pageLoaders[route] || (route.startsWith("/blog/") ? pageLoaders["/blog/:slug"] : route.startsWith("/admin") ? () => Promise.resolve() : pageLoaders["*"]);
};
