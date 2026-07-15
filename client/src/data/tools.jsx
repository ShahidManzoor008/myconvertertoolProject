import { FaCode, FaFilePdf, FaCog, FaQrcode, FaTextHeight, FaFileWord, FaSortAlphaDown, FaDatabase, FaExpandAlt, FaCompressAlt, FaRegFileAlt, FaSearch } from "react-icons/fa";

export const tools = [
  {
    name: "PDF Converter",
    path: "/tools/pdf-converter",
    icon: <FaFilePdf />,
    color: "red",
    category: "PDF Tools",
    description: "Convert, merge, split, compress, and edit PDF files online.",
    keywords: ["pdf", "word to pdf", "image to pdf", "merge pdf", "compress pdf"]
  },
  {
    name: "Markdown to DOCX",
    path: "/tools/markdown-to-docx",
    icon: <FaFileWord />,
    color: "indigo",
    category: "Text Tools",
    description: "Turn Markdown notes, docs, and drafts into DOCX files.",
    keywords: ["markdown", "docx", "word", "document"]
  },
  {
    name: "QR Code Generator",
    path: "/tools/qr-code-generator",
    icon: <FaQrcode />,
    color: "pink",
    category: "SEO Tools",
    description: "Create QR codes for links, text, campaigns, and sharing.",
    keywords: ["qr", "qr code", "marketing", "link"]
  },
  {
    name: "Meta Tag Preview",
    path: "/tools/meta-tag-preview",
    icon: <FaSearch />,
    color: "yellow",
    category: "SEO Tools",
    description: "Draft SEO titles and descriptions with Google-style preview checks.",
    keywords: ["meta tags", "seo title", "meta description", "serp preview"]
  },
  {
    name: "JSON Formatter",
    path: "/tools/json-formatter",
    icon: <FaCode />,
    color: "blue",
    category: "Dev Tools",
    description: "Format, validate, and beautify JSON data instantly.",
    keywords: ["json", "formatter", "beautify", "validator"]
  },
  {
    name: "Base64 Encoder/Decoder",
    path: "/tools/base64-encoder",
    icon: <FaDatabase />,
    color: "yellow",
    category: "Dev Tools",
    description: "Encode and decode Base64 text without setup.",
    keywords: ["base64", "encode", "decode", "developer"]
  },
  {
    name: "URL Encoder/Decoder",
    path: "/tools/url-encoder",
    icon: <FaExpandAlt />,
    color: "pink",
    category: "Dev Tools",
    description: "Encode and decode URLs, query strings, and special characters.",
    keywords: ["url", "encode", "decode", "query string"]
  },
  {
    name: "Minify & Beautify Code",
    path: "/tools/minify-beautify",
    icon: <FaCompressAlt />,
    color: "indigo",
    category: "Dev Tools",
    description: "Minify or beautify HTML, CSS, JavaScript, and JSON.",
    keywords: ["minify", "beautify", "html", "css", "javascript"]
  },
  {
    name: "Text Case Converter",
    path: "/tools/text-case-converter",
    icon: <FaSortAlphaDown />,
    color: "purple",
    category: "Text Tools",
    description: "Convert text to title case, uppercase, lowercase, and more.",
    keywords: ["case", "uppercase", "lowercase", "title case"]
  },
  {
    name: "Word & Character Counter",
    path: "/tools/word-counter",
    icon: <FaRegFileAlt />,
    color: "teal",
    category: "Text Tools",
    description: "Count words, characters, sentences, paragraphs, and reading time.",
    keywords: ["word counter", "character counter", "reading time", "text analysis"]
  },
  {
    name: "Dev Tools",
    path: "/tools/dev",
    icon: <FaCode />,
    color: "blue",
    category: "Category",
    description: "Developer utilities for formatting, encoding, and code cleanup.",
    keywords: ["developer tools", "json", "base64", "url"]
  },
  {
    name: "Text Tools",
    path: "/tools/text",
    icon: <FaTextHeight />,
    color: "green",
    category: "Category",
    description: "Simple text utilities for writers, students, and editors.",
    keywords: ["text", "case", "markdown", "word"]
  },
  {
    name: "SEO Tools",
    path: "/tools/seo",
    icon: <FaCog />,
    color: "yellow",
    category: "Category",
    description: "Marketing utilities for search, sharing, and campaign workflows.",
    keywords: ["seo", "marketing", "qr", "meta"]
  }
];

export const primaryTools = tools.filter((tool) => tool.category !== "Category");
