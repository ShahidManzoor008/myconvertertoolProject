import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Popup from "../../components/Popup";
import SEO from "../../utils/SEO";
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
    <div className="pb-20">
      <SEO 
        seoData={{
          title: 'Free Base64 Encoder & Decoder - Online Base64 Converter',
          description: 'Convert text to Base64 or decode Base64 to text instantly with our Free Online Base64 Encoder & Decoder. No sign-up, fast & secure!',
          keywords: 'Base64 encoder, Base64 decoder, online Base64 converter, free Base64 encoding tool, Base64 text converter, secure Base64 decoding, no signup, free developer tools, URL-safe Base64',
          canonicalUrl: '/tools/base64-encoder',
          ogType: 'website',
        }}
      />

      {/* Header */}
      <section className="text-center py-12 md:py-16" data-aos="fade-down">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-600/20 mb-6">
          <span className="material-icons text-xs">code</span>
          Data Transformation
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 leading-tight text-slate-900 dark:text-white">
          Base64 <span className="gradient-text">Engine</span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed font-medium">
          Professional-grade encoding and decoding for text and binary data with URL-safe support.
        </p>
      </section>

      <div className="max-w-4xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-1 sm:p-2 overflow-hidden"
        >
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-10 shadow-inner">
            {/* Tabs */}
            <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-8 max-w-xs mx-auto">
              <button
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all ${
                  activeTab === "text"
                    ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                onClick={() => setActiveTab("text")}
              >
                <FileText size={16} />
                TEXT
              </button>
              <button
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all ${
                  activeTab === "file"
                    ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                onClick={() => setActiveTab("file")}
              >
                <Upload size={16} />
                FILE
              </button>
            </div>

            {/* Help & Error */}
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => setIsHelpOpen(!isHelpOpen)}
                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
              >
                <HelpCircle size={14} />
                {isHelpOpen ? 'Hide Tips' : 'How it works'}
              </button>
              {error && <span className="text-xs font-bold text-red-500 animate-pulse">{error}</span>}
            </div>

            <AnimatePresence>
              {isHelpOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-8"
                >
                  <div className="p-6 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    <p className="mb-4 font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest text-[10px]">Guidelines</p>
                    <ol className="list-decimal pl-5 space-y-2 font-medium">
                      <li>Paste your raw text or Base64 string into the workspace.</li>
                      <li>Select <span className="text-slate-900 dark:text-white font-bold">Encode</span> to generate Base64 or <span className="text-slate-900 dark:text-white font-bold">Decode</span> for plain text.</li>
                      <li>Use <span className="text-purple-600 font-bold">URL-Safe</span> for web-compatible output (removes padding and replaces +/).</li>
                      <li>Export your results via clipboard or direct file download.</li>
                    </ol>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Input */}
            <div className="relative group">
              {activeTab === "text" ? (
                <textarea
                  className="w-full h-64 p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white font-mono text-sm leading-relaxed outline-none resize-none shadow-inner"
                  placeholder={mode === "encode" ? "Enter raw data to encode..." : "Paste Base64 string here..."}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              ) : (
                <div className="h-64 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center group-hover:border-blue-500/50 transition-all">
                  <input type="file" id="fileUpload" className="hidden" onChange={handleFileUpload} />
                  <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center">
                    <div className="w-20 h-20 rounded-3xl bg-white dark:bg-slate-900 shadow-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Upload className="text-blue-600" size={32} />
                    </div>
                    <span className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                      {selectedFile ? selectedFile.name : "Select Input File"}
                    </span>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                      {selectedFile ? `${(selectedFile.size / 1024).toFixed(2)} KB` : "Any format supported"}
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-10">
              <button
                onClick={handleEncode}
                className="btn-primary w-full sm:w-auto px-8 py-4"
              >
                Encode Data
              </button>
              <button
                onClick={handleDecode}
                className="px-8 py-4 rounded-2xl font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all w-full sm:w-auto"
              >
                Decode String
              </button>
              <button
                onClick={handleUrlEncodedBase64}
                className="px-8 py-4 rounded-2xl font-bold bg-purple-600 text-white shadow-lg shadow-purple-500/25 hover:bg-purple-700 transition-all w-full sm:w-auto"
              >
                URL-Safe Mode
              </button>
              <button
                onClick={handleReset}
                className="p-4 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all ml-auto"
              >
                <RotateCcw size={20} />
              </button>
            </div>

            {/* Results */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-12 pt-12 border-t border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white shadow-lg">
                        <span className="material-icons text-sm">task_alt</span>
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white">Output Generated</h3>
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {mode}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleCopy} className="p-3 rounded-xl glass hover:text-blue-600 transition-all">
                        <Copy size={18} />
                      </button>
                      <button onClick={handleFileExport} className="p-3 rounded-xl glass hover:text-blue-600 transition-all">
                        <Download size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="relative rounded-3xl overflow-hidden bg-slate-900 p-8 shadow-2xl">
                    <pre className="text-green-400 font-mono text-sm leading-relaxed overflow-auto max-h-80 scrollbar-hide">
                      {result}
                    </pre>
                  </div>

                  <div className="flex gap-6 mt-6">
                    <Stat label="Input" value={statistics.original} />
                    <Stat label="Output" value={statistics.converted} />
                    <Stat label="Efficiency" value={`${(statistics.original ? (statistics.converted / statistics.original) : 0).toFixed(2)}x`} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {popupMessage && (
        <div className="fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl bg-slate-900 text-white shadow-2xl flex items-center gap-3 animate-slide-up">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-bold uppercase tracking-widest">{popupMessage}</span>
        </div>
      )}
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div className="text-center sm:text-left">
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{value}</p>
  </div>
);

export default Base64Tool;
