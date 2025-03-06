// ============================
// 📂 MarkdownToDocx.jsx
// ============================
import { useState } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import API_BASE_URL from "../../../api.config";

const MarkdownToDocx = () => {
  const [file, setFile] = useState(null);
  const [popupMessage, setPopupMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Show Popup Function
  const showPopup = (message) => {
    setPopupMessage(message);
    setTimeout(() => setPopupMessage(""), 2500);
  };

  // Handle File Upload
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.toLowerCase().endsWith(".md")) {
      setFile(selectedFile);
      showPopup(`Selected file: ${selectedFile.name}`);
    } else {
      showPopup("Please upload a Markdown (.md) file");
    }
  };

  // Handle Clear Selection
  const handleClearFile = () => {
    setFile(null);
    showPopup("File selection cleared!");
  };

  // Handle Convert to DOCX
  const handleConvert = async () => {
    if (!file) return showPopup("No Markdown file selected!");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/api/convert-md-to-docx`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to convert Markdown to DOCX");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "converted-markdown.docx";
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      showPopup("Markdown converted to DOCX successfully!");
    } catch (error) {
      console.error("Markdown to DOCX Error:", error);
      showPopup("Failed to convert Markdown to DOCX");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-white border rounded shadow"
    >
      {/* ✅ SEO Optimization */}
      <Helmet>
        <title>Free Markdown to DOCX Converter - Convert MD to Word</title>
        <meta
          name="description"
          content="Easily convert Markdown (.md) to DOCX (Word) for free. No sign-up required, fast & secure conversion!"
        />
        <meta
          name="keywords"
          content="Markdown to DOCX, free Markdown converter, MD to Word, online Markdown to DOCX converter, convert Markdown to Word, no sign-up, free document tools"
        />
        <meta
          property="og:title"
          content="Free Markdown to DOCX Converter - Convert MD to Word"
        />
        <meta
          property="og:description"
          content="Easily convert Markdown (.md) to DOCX (Word) for free. No sign-up required, fast & secure conversion!"
        />
        <meta
          property="og:url"
          content="https://myconvertertool.com/tools/markdown-to-docx"
        />
        <meta property="og:type" content="website" />
      </Helmet>

      <h2 className="text-3xl font-bold text-blue-600 mb-4 text-center">
        Markdown to DOCX Converter
      </h2>
      <p className="text-center text-gray-500 mb-6">
        Upload a Markdown file (.md) and convert it to DOCX.
      </p>

      {/* ✅ File Upload Section with Clear Button */}
      <div className="flex flex-col items-center">
        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
          <div className="flex flex-col items-center justify-center">
            <svg
              className="w-10 h-10 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V12M17 16V12M12 16V8M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Click or drag & drop your{" "}
              <span className="font-semibold">Markdown (.md)</span> file here
            </p>
          </div>
          <input
            type="file"
            accept=".md"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {/* ✅ Show Selected File with Clear Button */}
        {file && (
          <div className="mt-4 flex items-center justify-between w-full max-w-md p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
            <p className="text-gray-700 dark:text-gray-200 text-sm truncate">
              📄 {file.name}
            </p>
            <button
              onClick={handleClearFile}
              className="ml-4 bg-red-500 text-white px-3 py-1 text-xs rounded-md hover:bg-red-600 transition"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* ✅ Convert & Clear Buttons */}
      <div className="flex justify-center gap-4 mt-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleConvert}
          disabled={loading}
          className={`px-4 py-2 text-white rounded-md transition ${
            loading ? "bg-gray-400" : "bg-indigo-500 hover:bg-indigo-600"
          }`}
        >
          {loading ? "Converting..." : "Convert to DOCX"}
        </motion.button>
      </div>

      {/* ✅ Popup Notification */}
      {popupMessage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mt-4 p-2 bg-green-100 text-green-700 text-center rounded"
        >
          {popupMessage}
        </motion.div>
      )}
    </motion.div>
  );
};

export default MarkdownToDocx;
