import { useState } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import Popup from "../../components/Popup";

const JsonFormatter = () => {
  const [jsonInput, setJsonInput] = useState("");
  const [formattedJson, setFormattedJson] = useState("");
  const [error, setError] = useState("");
  const [popupMessage, setPopupMessage] = useState("");

  const showPopup = (message) => {
    setPopupMessage(message);
    setTimeout(() => setPopupMessage(""), 2000);
  };

  const handleFormatJson = () => {
    try {
      const parsedJson = JSON.parse(jsonInput);
      setFormattedJson(JSON.stringify(parsedJson, null, 2));
      setError("");
    } catch (err) {
      setError("Invalid JSON. Please check your input.");
      setFormattedJson("");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson);
    showPopup("Copied to clipboard!");
  };

  const handleDownload = () => {
    const blob = new Blob([formattedJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formatted_json.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showPopup("File downloaded!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 max-w-5xl mx-auto"
    >
      {/* SEO Metadata */}
      import { Helmet } from "react-helmet-async";

<Helmet>
  <title>Free JSON Formatter & Beautifier - Online JSON Validator</title>
  <meta name="description" content="Use our Free Online JSON Formatter & Validator to beautify, minify, and validate JSON instantly. No sign-up required. Perfect for developers & data analysts!" />
  <meta name="keywords" content="free JSON formatter, JSON beautifier, online JSON validator, JSON minifier, pretty print JSON, JSON error checker, free online tools, developer tools" />
  <meta property="og:title" content="Free JSON Formatter & Beautifier - Online JSON Validator" />
  <meta property="og:description" content="Use our Free Online JSON Formatter & Validator to beautify, minify, and validate JSON instantly. No sign-up required. Perfect for developers & data analysts!" />
  <meta property="og:url" content="https://myconvertertool.com/tools/json-formatter" />
  <meta property="og:type" content="website" />
</Helmet>

      <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 text-center">
        JSON Formatter
      </h1>
      <p className="text-center text-gray-600 dark:text-gray-300 mt-2">
        Paste your JSON and format it instantly!
      </p>

      {/* Input Textarea */}
      <textarea
        className="w-full h-40 p-3 mt-6 border rounded-md dark:bg-gray-800 dark:text-white"
        placeholder="Paste JSON here..."
        value={jsonInput}
        onChange={(e) => setJsonInput(e.target.value)}
      ></textarea>

      {/* Format Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleFormatJson}
        className="w-full mt-4 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
      >
        Format JSON
      </motion.button>

      {/* Error Message */}
      {error && <p className="text-red-500 mt-3">{error}</p>}

      {/* Formatted JSON Output */}
      {formattedJson && (
        <div className="mt-6 bg-gray-100 dark:bg-gray-800 p-4 rounded-md shadow-md relative">
          <h2 className="text-xl font-semibold">Formatted JSON:</h2>
          <pre className="mt-2 text-gray-800 dark:text-gray-200 overflow-auto">
            {formattedJson}
          </pre>

          {/* Copy & Download Buttons */}
          <div className="flex gap-4 mt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopy}
              className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition"
            >
              Copy
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownload}
              className="bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition"
            >
              Download
            </motion.button>
          </div>
        </div>
      )}

      {/* Popup Notification */}
      {popupMessage && <Popup message={popupMessage} onClose={() => setPopupMessage("")} />}
    </motion.div>
  );
};

export default JsonFormatter;
