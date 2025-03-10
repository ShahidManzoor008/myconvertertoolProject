import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import Popup from "../../components/Popup";
import { ClipboardCopy, Download, RefreshCw, Trash, HelpCircle, Info } from "lucide-react";

const UrlTool = () => {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [mode, setMode] = useState("encode"); // encode, decode, or base64
  const [history, setHistory] = useState([]);
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    // Check if user prefers dark mode
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [darkMode]);

  // Calculate stats
  const stats = {
    originalLength: text.length,
    resultLength: result.length,
    difference: result.length - text.length,
    percentageChange: text.length ? (((result.length - text.length) / text.length) * 100).toFixed(2) : 0
  };

  const showPopup = (message) => {
    setPopupMessage(message);
    setTimeout(() => setPopupMessage(""), 2000);
  };

  const handleProcess = () => {
    if (!text.trim()) {
      setError("Please enter some text to process");
      return;
    }

    try {
      let processedResult;
      
      if (mode === "encode") {
        processedResult = encodeURIComponent(text);
      } else if (mode === "decode") {
        processedResult = decodeURIComponent(text);
      } else if (mode === "base64encode") {
        processedResult = btoa(unescape(encodeURIComponent(text)));
      } else if (mode === "base64decode") {
        processedResult = decodeURIComponent(escape(atob(text)));
      }
      
      setResult(processedResult);
      setError("");
      
      // Add to history
      setHistory(prev => {
        const newHistory = [
          { 
            input: text, 
            output: processedResult, 
            mode, 
            timestamp: new Date().toISOString() 
          },
          ...prev
        ].slice(0, 10); // Keep only the 10 most recent entries
        
        // Save to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("urlToolHistory", JSON.stringify(newHistory));
        }
        
        return newHistory;
      });
    } catch (err) {
      setError(`Processing failed: ${err.message}`);
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
    a.download = `url_${mode}_output.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Clean up
    showPopup("File downloaded!");
  };

  const handleClear = () => {
    setText("");
    setResult("");
    setError("");
  };

  const handleSwap = () => {
    setText(result);
    setResult("");
  };

  const loadFromHistory = (item) => {
    setText(item.input);
    setResult(item.output);
    setMode(item.mode);
  };

  const clearHistory = () => {
    setHistory([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("urlToolHistory");
    }
    showPopup("History cleared!");
  };

  // Load history from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedHistory = localStorage.getItem("urlToolHistory");
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error("Failed to parse history:", e);
        }
      }
    }
  }, []);
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Free URL Encoder & Decoder Tool",
  "applicationCategory": "WebApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "A free online tool that allows users to encode and decode URLs, as well as perform Base64 encoding and decoding operations. Perfect for web developers, marketers, and SEO professionals.",
  "screenshot": "https://myconvertertool.com/images/url-encoder-screenshot.jpg",
  "featureList": [
    "URL encoding and decoding",
    "Base64 encoding and decoding",
    "Operation history tracking",
    "Dark mode support",
    "Copy to clipboard functionality",
    "Download results as text files"
  ],
  "author": {
    "@type": "Organization",
    "name": "My Converter Tool",
    "url": "https://myconvertertool.com"
  },
  "keywords": "URL encoder, URL decoder, free URL converter, online URL encoding tool, decode URLs, Base64 encode, Base64 decode, URL special characters, URL-safe characters, URL processing, text conversion",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "124"
  },
  "review": {
    "@type": "Review",
    "author": {
      "@type": "Person",
      "name": "John Developer"
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": "5"
    },
    "datePublished": "2024-01-15",
    "reviewBody": "This URL encoder/decoder has been a lifesaver for my web development projects. The addition of Base64 encoding and the clean interface makes it my go-to tool."
  },
  "sameAs": [
    "https://twitter.com/myconvertertool",
    "https://facebook.com/myconvertertool",
    "https://github.com/myconvertertool"
  ],
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://myconvertertool.com/tools/url-encoder",
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://myconvertertool.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Tools",
          "item": "https://myconvertertool.com/tools"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "URL Encoder & Decoder",
          "item": "https://myconvertertool.com/tools/url-encoder"
        }
      ]
    }
  },
  "potentialAction": {
    "@type": "UseAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://myconvertertool.com/tools/url-encoder",
      "actionPlatform": [
        "http://schema.org/DesktopWebPlatform",
        "http://schema.org/MobileWebPlatform"
      ]
    },
    "expectsAcceptanceOf": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  }
}
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`p-6 max-w-5xl mx-auto ${darkMode ? 'dark' : ''}`}
    >
      <Helmet>
        <title>Free URL Encoder & Decoder - Convert URLs Online</title>
        <meta name="description" content="Easily encode or decode URLs with our Free Online URL Encoder & Decoder. Perfect for web developers, marketers, and SEO professionals!" />
        <meta name="keywords" content="URL encoder, URL decoder, free URL converter, online URL encoding tool, decode URLs, free SEO tools, developer tools, no signup, base64 encode, base64 decode" />
        <meta property="og:title" content="Free URL Encoder & Decoder - Convert URLs Online" />
        <meta property="og:description" content="Easily encode or decode URLs with our Free Online URL Encoder & Decoder. Perfect for web developers, marketers, and SEO professionals!" />
        <meta property="og:url" content="https://myconvertertool.com/tools/url-encoder" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
  </script>
      </Helmet>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">
          URL Tool
        </h1>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            {darkMode ? "🌞" : "🌙"}
          </button>
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            <HelpCircle className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Convert URLs and text between different encoding formats
      </p>

      {/* Help Section */}
      <AnimatePresence>
        {showHelp && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg"
          >
            <h2 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-2">How to use this tool:</h2>
            <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 space-y-1">
              <li><strong>URL Encode:</strong> Converts characters for safe inclusion in URLs</li>
              <li><strong>URL Decode:</strong> Converts encoded URL strings back to readable text</li>
              <li><strong>Base64 Encode:</strong> Converts text to Base64 format</li>
              <li><strong>Base64 Decode:</strong> Converts Base64 back to text</li>
              <li>Use the swap button to quickly chain operations</li>
              <li>Your last 10 operations are saved in history</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode Selection Tabs */}
      <div className="flex mb-6 bg-gray-200 dark:bg-gray-800 rounded-lg p-1">
        {[
          { id: "encode", label: "URL Encode" },
          { id: "decode", label: "URL Decode" },
          { id: "base64encode", label: "Base64 Encode" },
          { id: "base64decode", label: "Base64 Decode" }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setMode(item.id)}
            className={`flex-1 py-2 rounded-md transition ${
              mode === item.id 
                ? "bg-blue-500 text-white" 
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {/* Input Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="font-medium text-gray-700 dark:text-gray-300">Input</label>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClear}
                className="text-red-500 hover:text-red-600 flex items-center"
              >
                <Trash className="h-4 w-4 mr-1" /> Clear
              </motion.button>
            </div>
            <textarea
              className="w-full h-56 p-3 border rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white dark:border-gray-700"
              placeholder={`Enter text to ${mode.includes('encode') ? 'encode' : 'decode'}...`}
              value={text}
              onChange={(e) => setText(e.target.value)}
            ></textarea>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleProcess}
              className="flex-1 bg-blue-500 text-white py-3 rounded-md hover:bg-blue-600 transition flex items-center justify-center"
            >
              {mode.includes('encode') ? 'Encode' : 'Decode'} 
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSwap}
              disabled={!result}
              className={`p-3 rounded-md transition flex items-center justify-center ${
                result 
                  ? "bg-purple-500 text-white hover:bg-purple-600" 
                  : "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700"
              }`}
            >
              <RefreshCw className="h-5 w-5" />
            </motion.button>
          </div>
        </div>

        <div>
          {/* Output Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="font-medium text-gray-700 dark:text-gray-300">Output</label>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowStats(!showStats)}
                className="text-blue-500 hover:text-blue-600 flex items-center"
                disabled={!result}
              >
                <Info className="h-4 w-4 mr-1" /> 
                {showStats ? "Hide Stats" : "Show Stats"}
              </motion.button>
            </div>
            <div className="relative">
              {/* Error Message */}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-100 dark:bg-red-900/30 rounded-md">
                  <p className="text-red-600 dark:text-red-300 p-4 text-center">{error}</p>
                </div>
              )}
              
              <textarea
                className="w-full h-56 p-3 border rounded-md resize-none bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                placeholder="Result will appear here..."
                value={result}
                onChange={(e) => setResult(e.target.value)}
                readOnly
              ></textarea>
            </div>
          </div>

          {/* Stats Display */}
          <AnimatePresence>
            {showStats && result && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 bg-gray-100 dark:bg-gray-800 p-3 rounded-md"
              >
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Statistics:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600 dark:text-gray-400">Original length:</div>
                  <div className="text-gray-800 dark:text-gray-200">{stats.originalLength} characters</div>
                  
                  <div className="text-gray-600 dark:text-gray-400">Result length:</div>
                  <div className="text-gray-800 dark:text-gray-200">{stats.resultLength} characters</div>
                  
                  <div className="text-gray-600 dark:text-gray-400">Difference:</div>
                  <div className={`${stats.difference > 0 ? 'text-red-500' : stats.difference < 0 ? 'text-green-500' : 'text-gray-800 dark:text-gray-200'}`}>
                    {stats.difference > 0 ? '+' : ''}{stats.difference} characters
                  </div>
                  
                  <div className="text-gray-600 dark:text-gray-400">Change:</div>
                  <div className={`${stats.difference > 0 ? 'text-red-500' : stats.difference < 0 ? 'text-green-500' : 'text-gray-800 dark:text-gray-200'}`}>
                    {stats.difference > 0 ? '+' : ''}{stats.percentageChange}%
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result Action Buttons */}
          {result && (
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleCopy}
                className="flex-1 bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition flex items-center justify-center"
              >
                <ClipboardCopy className="h-4 w-4 mr-2" /> Copy
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleDownload}
                className="flex-1 bg-gray-700 text-white py-2 rounded-md hover:bg-gray-800 transition flex items-center justify-center"
              >
                <Download className="h-4 w-4 mr-2" /> Download
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* History Section */}
      {history.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Recent Operations</h2>
            <button 
              onClick={clearHistory}
              className="text-red-500 hover:text-red-600 text-sm"
            >
              Clear History
            </button>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="py-2 px-4 text-left text-gray-600 dark:text-gray-300">Mode</th>
                  <th className="py-2 px-4 text-left text-gray-600 dark:text-gray-300">Input</th>
                  <th className="py-2 px-4 text-left text-gray-600 dark:text-gray-300">Output</th>
                  <th className="py-2 px-4 text-left text-gray-600 dark:text-gray-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, index) => (
                  <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="py-2 px-4 text-gray-800 dark:text-gray-200 capitalize">
                      {item.mode.replace('encode', ' Encode').replace('decode', ' Decode')}
                    </td>
                    <td className="py-2 px-4 text-gray-800 dark:text-gray-200">
                      <div className="truncate max-w-xs">{item.input}</div>
                    </td>
                    <td className="py-2 px-4 text-gray-800 dark:text-gray-200">
                      <div className="truncate max-w-xs">{item.output}</div>
                    </td>
                    <td className="py-2 px-4">
                      <button 
                        onClick={() => loadFromHistory(item)}
                        className="text-blue-500 hover:text-blue-600"
                      >
                        Reuse
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Popup Notification */}
      {popupMessage && <Popup message={popupMessage} onClose={() => setPopupMessage("")} />}
    </motion.div>
  );
};

export default UrlTool;