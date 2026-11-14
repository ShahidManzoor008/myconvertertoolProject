import { FaCode, FaFilePdf, FaCog, FaQrcode, FaTextHeight, FaFileWord, FaFileExcel, FaSortAlphaDown, FaDatabase, FaExpandAlt, FaCompressAlt, FaRegFileAlt, FaSearch, FaFileImage } from "react-icons/fa";

export const tools = [
  {
    name: "Excel ↔ PDF",
    path: "/tools/excel-pdf",
    icon: <FaFileExcel />,
    color: "green",
    category: "PDF Tools",
    description: "Convert spreadsheets to PDF or extract tables from text-based PDFs into Excel.",
    actions: [
      { label: "Excel → PDF", href: "/tools/excel-pdf?mode=excel-to-pdf" },
      { label: "PDF → Excel", href: "/tools/excel-pdf?mode=pdf-to-excel" },
    ],
    keywords: ["excel", "spreadsheet", "xlsx", "xls", "pdf to excel", "excel to pdf", "tables"]
  },
  {
    name: "PDF Converter",
    path: "/tools/pdf-converter",
    icon: <FaFilePdf />,
    color: "red",
    category: "PDF Tools",
    description: "Convert Word, Excel, PowerPoint, Markdown, text, and images to PDF, or view a PDF in your browser.",
    actions: [
      { label: "Convert files to PDF", href: "/tools/pdf-converter?mode=convert" },
      { label: "View a PDF", href: "/tools/pdf-converter?mode=view" },
    ],
    keywords: ["pdf converter", "word to pdf", "excel to pdf", "powerpoint to pdf", "markdown to pdf", "image to pdf", "online pdf viewer"]
  },
  {
    name: "File Compressor",
    path: "/tools/file-compressor",
    icon: <FaFileImage />,
    color: "teal",
    category: "PDF Tools",
    description: "Reduce PDF and image file sizes with adjustable compression levels, image resizing, and format options.",
    actions: [
      { label: "Compress PDF", href: "/tools/file-compressor?mode=pdf" },
      { label: "Compress images", href: "/tools/file-compressor?mode=image" },
    ],
    keywords: ["compress pdf", "image compressor", "compress image", "reduce file size", "jpg compressor", "png compressor", "webp"]
  },
  {
    name: "Markdown to DOCX",
    path: "/tools/markdown-to-docx",
    icon: <FaFileWord />,
    color: "indigo",
    category: "Text Tools",
    description: "Convert Markdown files or pasted notes into Word DOCX, preserving equations, tables, lists, and code blocks.",
    actions: [
      { label: "Paste Markdown → DOCX", href: "/tools/markdown-to-docx?mode=paste" },
      { label: "Upload .md → DOCX", href: "/tools/markdown-to-docx?mode=upload" },
    ],
    keywords: ["markdown", "docx", "word", "document"]
  },
  {
    name: "QR Code Generator",
    path: "/tools/qr-code-generator",
    icon: <FaQrcode />,
    color: "pink",
    category: "SEO Tools",
    description: "Generate downloadable QR codes for URLs, plain text, Wi-Fi, contact details, and events.",
    actions: [
      { label: "Create URL QR", href: "/tools/qr-code-generator?type=url" },
      { label: "Create Wi-Fi QR", href: "/tools/qr-code-generator?type=wifi" },
      { label: "Create contact QR", href: "/tools/qr-code-generator?type=contact" },
    ],
    keywords: ["qr", "qr code", "marketing", "link"]
  },
  {
    name: "Meta Tag Preview",
    path: "/tools/meta-tag-preview",
    icon: <FaSearch />,
    color: "yellow",
    category: "SEO Tools",
    description: "Write and preview SEO titles, meta descriptions, canonical URLs, and Open Graph tags.",
    actions: [{ label: "Edit & preview SEO tags", href: "/tools/meta-tag-preview" }],
    keywords: ["meta tags", "seo title", "meta description", "serp preview"]
  },
  {
    name: "JSON Formatter",
    path: "/tools/json-formatter",
    icon: <FaCode />,
    color: "blue",
    category: "Dev Tools",
    description: "Format, validate, minify, and inspect JSON in your browser, with no upload required.",
    actions: [
      { label: "Format & validate JSON", href: "/tools/json-formatter?mode=format" },
      { label: "Minify JSON", href: "/tools/json-formatter?mode=minify" },
      { label: "Analyze JSON", href: "/tools/json-formatter?mode=analyze" },
    ],
    keywords: ["json", "formatter", "beautify", "validator"]
  },
  {
    name: "Base64 Encoder/Decoder",
    path: "/tools/base64-encoder",
    icon: <FaDatabase />,
    color: "yellow",
    category: "Dev Tools",
    description: "Encode text as Base64 or decode Base64 strings back to readable text.",
    actions: [
      { label: "Encode to Base64", href: "/tools/base64-encoder?mode=encode" },
      { label: "Decode Base64", href: "/tools/base64-encoder?mode=decode" },
    ],
    keywords: ["base64", "encode", "decode", "developer"]
  },
  {
    name: "URL Encoder/Decoder",
    path: "/tools/url-encoder",
    icon: <FaExpandAlt />,
    color: "pink",
    category: "Dev Tools",
    description: "Percent-encode or decode URLs and query values, with Base64 encode and decode modes too.",
    actions: [
      { label: "Encode URL", href: "/tools/url-encoder?mode=encode" },
      { label: "Decode URL", href: "/tools/url-encoder?mode=decode" },
      { label: "Encode Base64", href: "/tools/url-encoder?mode=base64encode" },
      { label: "Decode Base64", href: "/tools/url-encoder?mode=base64decode" },
    ],
    keywords: ["url", "encode", "decode", "query string"]
  },
  {
    name: "Minify & Beautify Code",
    path: "/tools/minify-beautify",
    icon: <FaCompressAlt />,
    color: "indigo",
    category: "Dev Tools",
    description: "Minify or format HTML, CSS, JavaScript, and JSON directly in your browser.",
    actions: [
      { label: "Beautify code", href: "/tools/minify-beautify?mode=beautify" },
      { label: "Minify code", href: "/tools/minify-beautify?mode=minify" },
    ],
    keywords: ["minify", "beautify", "html", "css", "javascript"]
  },
  {
    name: "Text Case Converter",
    path: "/tools/text-case-converter",
    icon: <FaSortAlphaDown />,
    color: "purple",
    category: "Text Tools",
    description: "Change text to uppercase, lowercase, title case, sentence case, and other common styles.",
    actions: [
      { label: "UPPERCASE", href: "/tools/text-case-converter?mode=uppercase" },
      { label: "lowercase", href: "/tools/text-case-converter?mode=lowercase" },
      { label: "Title Case", href: "/tools/text-case-converter?mode=title" },
      { label: "Sentence case", href: "/tools/text-case-converter?mode=sentence" },
    ],
    keywords: ["case", "uppercase", "lowercase", "title case"]
  },
  {
    name: "Word & Character Counter",
    path: "/tools/word-counter",
    icon: <FaRegFileAlt />,
    color: "teal",
    category: "Text Tools",
    description: "Count words, characters, sentences, and paragraphs, and estimate reading and speaking time.",
    actions: [
      { label: "Count & analyze text", href: "/tools/word-counter?mode=count" },
      { label: "Clean extra spaces", href: "/tools/word-counter?mode=clean" },
    ],
    keywords: ["word counter", "character counter", "reading time", "text analysis"]
  },
  {
    name: "Dev Tools",
    path: "/tools/dev",
    icon: <FaCode />,
    color: "blue",
    category: "Category",
    description: "Format JSON and code, encode URLs or Base64, and clean up HTML, CSS, JavaScript, and JSON.",
    keywords: ["developer tools", "json", "base64", "url"]
  },
  {
    name: "Text Tools",
    path: "/tools/text",
    icon: <FaTextHeight />,
    color: "green",
    category: "Category",
    description: "Count and transform text, or convert Markdown notes and equations into Word documents.",
    keywords: ["text", "case", "markdown", "word"]
  },
  {
    name: "SEO Tools",
    path: "/tools/seo",
    icon: <FaCog />,
    color: "yellow",
    category: "Category",
    description: "Preview SEO metadata and create QR codes for websites, contacts, Wi-Fi, and campaigns.",
    keywords: ["seo", "marketing", "qr", "meta"]
  }
];

export const primaryTools = tools.filter((tool) => tool.category !== "Category");
