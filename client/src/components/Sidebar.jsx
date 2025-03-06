import { Link, useLocation } from "react-router-dom";
import { FaCode, FaFilePdf, FaCog, FaTools, FaTerminal, FaQrcode, FaTextHeight, FaFileWord } from "react-icons/fa";

const tools = [
  { name: "PDF Converter", path: "/tools/pdf-converter", icon: <FaFilePdf />, color: "bg-red-500" },
  { name: "Markdown to DOCX", path: "/tools/markdown-to-docx", icon: <FaFileWord />, color: "bg-indigo-500" },
  { name: "QR Code Generator", path: "/tools/qr-code-generator", icon: <FaQrcode />, color: "bg-pink-500" },
  { name: "JSON Formatter", path: "/tools/json-formatter", icon: <FaCode />, color: "bg-blue-500" },
  { name: "Base64 Encoder/Decoder", path: "/tools/base64-encoder", icon: <FaTerminal />, color: "bg-green-500" },
  { name: "URL Encoder/Decoder", path: "/tools/url-encoder", icon: <FaCog />, color: "bg-purple-500" },
  { name: "Minify & Beautify Code", path: "/tools/minify-beautify", icon: <FaTools />, color: "bg-yellow-500" },
  { name: "Text Case Converter", path: "/tools/text-case-converter", icon: <FaTextHeight />, color: "bg-teal-500" }  
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <>
      {/* ✅ Sidebar (ABSOLUTE, Floating on Right, Hidden on Mobile) */}
      <aside className="hidden lg:block absolute top-25 right-4 w-44 bg-white dark:bg-gray-800 shadow-lg p-4 border-l border-gray-200 dark:border-gray-700 rounded-md">
        <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400">📂 Tools</h2>
        <ul className="mt-3 space-y-2">
          {tools
            .filter(tool => tool.path !== location.pathname) // Hide active tool
            .map((tool, index) => (
              <li key={index}>
                <Link
                  to={tool.path}
                  className={`flex items-center gap-2 p-2 rounded-md text-white dark:text-gray-300 hover:opacity-90 transition duration-300 text-sm ${tool.color}`}
                >
                  <span className="text-lg">{tool.icon}</span>
                  <span>{tool.name}</span>
                </Link>
              </li>
            ))}
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;
