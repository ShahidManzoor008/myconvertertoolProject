import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Popup from "../../components/Popup";
import { Helmet } from "react-helmet-async";
import { Copy, Download, RotateCcw, Upload, FileText, HelpCircle } from "lucide-react";
import { statsApi } from "../../utils/apiClient";

const Base64Tool = () => {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [activeTab, setActiveTab] = useState("text"); // text or file
  const [selectedFile, setSelectedFile] = useState(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [statistics, setStatistics] = useState({ original: 0, converted: 0 });
  const [mode, setMode] = useState("encode"); // encode or decode

  useEffect(() => {
    // Update statistics whenever text or result changes
    setStatistics({
      original: text.length,
      converted: result.length
    });
  }, [text, result]);

  const showPopup = (message) => {
    setPopupMessage(message);
    setTimeout(() => setPopupMessage(""), 2000);
  };

  const handleEncode = async () => {
    setMode("encode");
    try {
      const encoded = btoa(text);
      setResult(encoded); // Encode to Base64
      setError("");
      
      // Log conversion
      statsApi.increment({
        toolName: 'base64-encode',
        fileSize: text.length
      }).catch(err => console.error('Failed to log stats:', err));
    } catch {
      setError("Encoding failed. Please check your input.");
      setResult("");
    }
  };

  const handleDecode = async () => {
    setMode("decode");
    try {
      const decoded = atob(text);
      setResult(decoded); // Decode from Base64
      setError("");

      // Log conversion
      statsApi.increment({
        toolName: 'base64-decode',
        fileSize: text.length
      }).catch(err => console.error('Failed to log stats:', err));
    } catch {
      setError("Decoding failed. Invalid Base64 input.");
      setResult("");
    }
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
    a.download = `base64_${mode === "encode" ? "encoded" : "decoded"}_output.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Clean up
    showPopup("File downloaded!");
  };

  const handleReset = () => {
    setText("");
    setResult("");
    setError("");
    setSelectedFile(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();

    if (mode === "encode") {
      reader.onload = (event) => {
        const base64 = event.target.result.split(",")[1]; // Remove data URL part
        setText(base64);
        setResult(base64);
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (event) => {
        try {
          const text = event.target.result;
          setText(text);
          setResult(atob(text));
          setError("");
        } catch {
          setError("Decoding failed. Invalid Base64 file.");
          setResult("");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileExport = () => {
    // For binary data decoded from Base64
    if (mode === "decode" && result) {
      try {
        // Try to convert the result to a Uint8Array (for binary data)
        const binaryString = atob(text);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const blob = new Blob([bytes], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "decoded_file";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showPopup("Binary file exported!");
      } catch {
        setError("Failed to export binary file. The decoded data may not be binary content.");
      }
    } else {
      handleDownload();
    }
  };

  const handleUrlEncodedBase64 = () => {
    if (mode === "encode") {
      try {
        // First encode to Base64, then make it URL safe
        const base64 = btoa(text);
        const urlSafeBase64 = base64
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");
        setResult(urlSafeBase64);
        setError("");
      } catch {
        setError("URL-safe encoding failed. Please check your input.");
        setResult("");
      }
    } else {
      try {
        // First make it standard Base64 by reversing URL safe encoding, then decode
        let standardBase64 = text
          .replace(/-/g, "+")
          .replace(/_/g, "/");
        
        // Add back padding if needed
        while (standardBase64.length % 4) {
          standardBase64 += "=";
        }
        
        setResult(atob(standardBase64));
        setError("");
      } catch {
        setError("URL-safe decoding failed. Invalid input.");
        setResult("");
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 max-w-5xl mx-auto"
    >
      <Helmet>
        <title>Free Base64 Encoder & Decoder - Online Base64 Converter</title>
        <meta name="description" content="Convert text to Base64 or decode Base64 to text instantly with our Free Online Base64 Encoder & Decoder. No sign-up, fast & secure!" />
        <meta name="keywords" content="Base64 encoder, Base64 decoder, online Base64 converter, free Base64 encoding tool, Base64 text converter, secure Base64 decoding, no signup, free developer tools, URL-safe Base64" />
        <meta property="og:title" content="Free Base64 Encoder & Decoder - Online Base64 Converter" />
        <meta property="og:description" content="Convert text to Base64 or decode Base64 to text instantly with our Free Online Base64 Encoder & Decoder. No sign-up, fast & secure!" />
        <meta property="og:url" content="https://myconvertertool.com/tools/base64-encoder" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">
          Base64 Encoder/Decoder
        </h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsHelpOpen(!isHelpOpen)}
          className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 p-2 rounded-full"
        >
          <HelpCircle size={20} />
        </motion.button>
      </div>
      
      <p className="text-gray-600 dark:text-gray-300 mt-2">
        Encode or decode text and files using Base64 with additional options.
      </p>

      {/* Help Section */}
      {isHelpOpen && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm">
          <h3 className="font-bold text-blue-700 dark:text-blue-300 mb-2">About Base64</h3>
          <p className="mb-2">Base64 is a binary-to-text encoding scheme that represents binary data in ASCII string format by translating it into a radix-64 representation.</p>
          <h3 className="font-bold text-blue-700 dark:text-blue-300 mb-2 mt-3">How to use:</h3>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Enter text to encode or paste Base64 to decode</li>
            <li>Alternatively, upload a file</li>
            <li>Click the appropriate action button</li>
            <li>Copy or download the result</li>
          </ol>
          <h3 className="font-bold text-blue-700 dark:text-blue-300 mb-2 mt-3">Features:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Standard Base64 encoding/decoding</li>
            <li>URL-safe Base64 variant</li>
            <li>File upload and download capabilities</li>
            <li>Character count statistics</li>
          </ul>
        </div>
      )}

      {/* Input Type Selection */}
      <div className="flex border-b mt-6 dark:border-gray-700">
        <button
          className={`px-4 py-2 ${
            activeTab === "text"
              ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
          onClick={() => setActiveTab("text")}
        >
          <FileText className="inline mr-2" size={16} />
          Text Input
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === "file"
              ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
          onClick={() => setActiveTab("file")}
        >
          <Upload className="inline mr-2" size={16} />
          File Upload
        </button>
      </div>

      {/* Text Input */}
      {activeTab === "text" && (
        <textarea
          className="w-full h-40 p-3 mt-4 border rounded-md dark:bg-gray-800 dark:text-white"
          placeholder={mode === "encode" ? "Enter text to encode..." : "Enter Base64 to decode..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
        ></textarea>
      )}

      {/* File Input */}
      {activeTab === "file" && (
        <div className="mt-4 border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 rounded-md text-center">
          <input
            type="file"
            id="fileUpload"
            className="hidden"
            onChange={handleFileUpload}
          />
          <label
            htmlFor="fileUpload"
            className="cursor-pointer flex flex-col items-center justify-center"
          >
            <Upload size={40} className="text-gray-400 dark:text-gray-500 mb-2" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {selectedFile ? selectedFile.name : "Click to upload a file"}
            </span>
            {selectedFile && (
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </span>
            )}
          </label>
        </div>
      )}

      {/* Mode Selection & Action Buttons */}
      <div className="mt-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-md">
        <div className="flex flex-wrap gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleEncode}
            className={`${
              mode === "encode" ? "bg-green-600" : "bg-green-500"
            } text-white py-2 px-4 rounded-md hover:bg-green-600 transition`}
          >
            Encode
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDecode}
            className={`${
              mode === "decode" ? "bg-blue-600" : "bg-blue-500"
            } text-white py-2 px-4 rounded-md hover:bg-blue-600 transition`}
          >
            Decode
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleUrlEncodedBase64}
            className="bg-purple-500 text-white py-2 px-4 rounded-md hover:bg-purple-600 transition"
          >
            {mode === "encode" ? "URL-Safe Encode" : "URL-Safe Decode"}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReset}
            className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition ml-auto"
          >
            <RotateCcw size={16} className="inline mr-1" />
            Reset
          </motion.button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Statistics */}
      {(text || result) && (
        <div className="mt-4 flex gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            Input length: <span className="font-mono">{statistics.original}</span> characters
          </div>
          <div>
            Output length: <span className="font-mono">{statistics.converted}</span> characters
          </div>
          <div>
            Ratio: <span className="font-mono">
              {statistics.original && (statistics.converted / statistics.original).toFixed(2)}x
            </span>
          </div>
        </div>
      )}

      {/* Output Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-6 bg-gray-100 dark:bg-gray-800 p-4 rounded-md shadow-md"
        >
          <h2 className="text-xl font-semibold flex items-center">
            Result
            <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
              {mode === "encode" ? "Encoded" : "Decoded"}
            </span>
          </h2>
          
          <div className="mt-2 relative">
            <pre 
              className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-gray-800 dark:text-gray-200 overflow-auto max-h-64"
            >
              {result}
            </pre>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCopy}
              className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition flex items-center"
            >
              <Copy size={16} className="mr-2" />
              Copy to Clipboard
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleFileExport}
              className="bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition flex items-center"
            >
              <Download size={16} className="mr-2" />
              {mode === "decode" ? "Export File" : "Download Text"}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Popup Notification */}
      {popupMessage && <Popup message={popupMessage} onClose={() => setPopupMessage("")} />}
    </motion.div>
  );
};

export default Base64Tool;
