import { FaCode, FaFilePdf, FaCog, FaQrcode, FaTextHeight, FaFileWord, FaSortAlphaDown, FaDatabase, FaExpandAlt, FaCompressAlt } from "react-icons/fa";

export const tools = [
  { name: "PDF Tools", path: "/tools/pdf-converter", icon: <FaFilePdf />, color: "red" },
  { name: "Markdown to DOCX", path: "/tools/markdown-to-docx", icon: <FaFileWord />, color: "indigo" },
  { name: "QR Code Generator", path: "/tools/qr-code-generator", icon: <FaQrcode />, color: "pink" },
  { name: "JSON Formatter", path: "/tools/json-formatter", icon: <FaCode />, color: "blue" },
  { name: "Base64 Encoder/Decoder", path: "/tools/base64-encoder", icon: <FaDatabase />, color: "yellow" },
  { name: "URL Encoder/Decoder", path: "/tools/url-encoder", icon: <FaExpandAlt />, color: "pink" },
  { name: "Minify & Beautify Code", path: "/tools/minify-beautify", icon: <FaCompressAlt />, color: "indigo" },
  { name: "Text Case Converter", path: "/tools/text-case-converter", icon: <FaSortAlphaDown />, color: "purple" },
  { name: "Dev Tools", path: "/tools/dev", icon: <FaCode />, color: "blue" },
  { name: "Text Tools", path: "/tools/text", icon: <FaTextHeight />, color: "green" },
  { name: "SEO Tools", path: "/tools/seo", icon: <FaCog />, color: "yellow" },
  { name: "PDF Tools", path: "/tools/pdf", icon: <FaFilePdf />, color: "pink" }
];
