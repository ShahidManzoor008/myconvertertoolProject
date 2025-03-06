import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Popup from "../../components/Popup";
import { js, css, html } from "js-beautify";
import { Helmet } from "react-helmet-async";

const MinifyBeautifyTool = () => {
  const [code, setCode] = useState("");
  const [result, setResult] = useState("");
  const [language, setLanguage] = useState("js"); // Default language
  const [popupMessage, setPopupMessage] = useState("");
  const iframeRef = useRef(null);

  useEffect(() => {
    if (language === "html" || language === "css") {
      updatePreview();
    }
  }, [result, language]);

  const showPopup = (message) => {
    setPopupMessage(message);
    setTimeout(() => setPopupMessage(""), 2000);
  };

  const handleBeautify = () => {
    let formattedCode = code;
    if (language === "js") formattedCode = js(code, { indent_size: 2 });
    else if (language === "css") formattedCode = css(code, { indent_size: 2 });
    else if (language === "html") formattedCode = html(code, { indent_size: 2 });

    setResult(formattedCode);
  };

  const handleMinify = () => {
    let minifiedCode = code;
    if (language === "js") minifiedCode = js(code, { indent_size: 0 });
    else if (language === "css") minifiedCode = css(code, { indent_size: 0 });
    else if (language === "html") minifiedCode = html(code, { indent_size: 0 });

    setResult(minifiedCode);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    showPopup("Copied to clipboard!");
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `formatted_code.${language}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showPopup("File downloaded!");
  };

  const updatePreview = () => {
    if (iframeRef.current) {
      let previewContent = result;
      if (language === "css") {
        previewContent = `<style>${result}</style><p>CSS Applied</p>`;
      } else if (language === "html") {
        previewContent = result;
      }
      iframeRef.current.srcdoc = previewContent;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="p-6 max-w-5xl mx-auto">
      <Helmet>
  <title>Free Code Minifier & Beautifier - Minify JS, CSS, HTML</title>
  <meta name="description" content="Use our Free Online Minifier & Beautifier to minify JavaScript, CSS, and HTML code. Reduce file size, improve performance, and beautify code for readability!" />
  <meta name="keywords" content="JS minifier, CSS minifier, HTML beautifier, JavaScript beautifier, free code beautifier, minify code online, online code minifier, developer tools, free online tools" />
  <meta property="og:title" content="Free Code Minifier & Beautifier - Minify JS, CSS, HTML" />
  <meta property="og:description" content="Use our Free Online Minifier & Beautifier to minify JavaScript, CSS, and HTML code. Reduce file size, improve performance, and beautify code for readability!" />
  <meta property="og:url" content="https://myconvertertool.com/tools/minify-beautify" />
  <meta property="og:type" content="website" />
</Helmet>

      <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 text-center">Minify & Beautify Code</h1>
      <p className="text-center text-gray-600 dark:text-gray-300 mt-2">Format or Minify your JavaScript, CSS, or HTML.</p>

      {/* Language Selection */}
      <div className="flex gap-4 mt-4">
        {["js", "css", "html"].map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`px-4 py-2 rounded-md ${language === lang ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700"} transition`}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Input Code Area */}
      <textarea className="w-full h-40 p-3 mt-6 border rounded-md dark:bg-gray-800 dark:text-white" placeholder={`Paste your ${language.toUpperCase()} code here...`} value={code} onChange={(e) => setCode(e.target.value)}></textarea>

      {/* Beautify & Minify Buttons */}
      <div className="flex gap-4 mt-4">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleBeautify} className="w-1/2 bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition">Beautify</motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleMinify} className="w-1/2 bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition">Minify</motion.button>
      </div>

      {/* Output Result */}
      {result && (
        <div className="mt-6 bg-gray-100 dark:bg-gray-800 p-4 rounded-md shadow-md relative">
          <h2 className="text-xl font-semibold">Formatted Code:</h2>
          <pre className="mt-2 text-gray-800 dark:text-gray-200 overflow-auto">{result}</pre>

          {/* Copy & Download Buttons */}
          <div className="flex gap-4 mt-4">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleCopy} className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition">Copy</motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleDownload} className="bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition">Download</motion.button>
          </div>
        </div>
      )}

      {/* Live Preview for HTML & CSS */}
      {(language === "html" || language === "css") && result && (
        <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded-md shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Live Preview:</h2>
          <iframe ref={iframeRef} className="w-full h-64 mt-4 border rounded-md bg-white"></iframe>
        </div>
      )}

      {/* Popup Notification */}
      {popupMessage && <Popup message={popupMessage} onClose={() => setPopupMessage("")} />}
    </motion.div>
  );
};

export default MinifyBeautifyTool;
