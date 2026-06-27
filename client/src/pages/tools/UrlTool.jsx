import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardCopy, Download, RefreshCw, Trash, HelpCircle, Info } from "lucide-react";
import SEO from "../../utils/SEO";
import ToolSupportSection from "../../components/ToolSupportSection";
import { statsApi } from "../../utils/apiClient";

const UrlTool = () => {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [mode, setMode] = useState("encode"); // encode, decode, or base64
  const [history, setHistory] = useState([]);
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);

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

  const handleProcess = async () => {
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
      
      // Log conversion
      statsApi.increment({
        toolName: `url-${mode}`,
        fileSize: text.length
      }).catch(err => console.error('Failed to log stats:', err));

      // Add to history
      const newEntry = { 
        input: text, 
        output: processedResult, 
        mode, 
        timestamp: new Date().toISOString() 
      };

      setHistory(prev => {
        const newHistory = [newEntry, ...prev].slice(0, 10);
        localStorage.setItem("urlToolHistory", JSON.stringify(newHistory));
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
    URL.revokeObjectURL(url);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("urlToolHistory");
    showPopup("History cleared!");
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem("urlToolHistory");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history:", e);
      }
    }
  }, []);

  return (
    <div className="pb-20">
      <SEO 
        seoData={{
          title: 'URL Encoder & Decoder Pro - Web Protocol Utilities',
          description: 'Securely encode or decode URLs and Base64 data with our professional online converter. Perfect for developers, SEOs, and marketers.',
          keywords: 'url encoder, url decoder, base64 encoder, percent encoding, uri component, developer tools',
          canonicalUrl: '/tools/url-encoder',
          ogType: 'website',
        }}
      />

      {/* Header */}
      <section className="text-center py-12 md:py-16" data-aos="fade-down">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-600/20 mb-6">
          <span className="material-icons text-xs">link</span>
          Protocol Suite
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 leading-tight text-slate-900 dark:text-white">
          URL <span className="gradient-text">Master</span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed font-medium">
          The professional standard for URI manipulation and secure data encoding.
        </p>
      </section>

      <div className="max-w-6xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-1 overflow-hidden"
        >
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-10 shadow-inner">
            {/* Mode Selection */}
            <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-10 max-w-lg mx-auto overflow-x-auto scrollbar-hide">
              {[
                { id: "encode", label: "URL ENC" },
                { id: "decode", label: "URL DEC" },
                { id: "base64encode", label: "B64 ENC" },
                { id: "base64decode", label: "B64 DEC" }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setMode(item.id)}
                  className={`flex-1 min-w-[80px] py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${
                    mode === item.id 
                      ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Input Workspace */}
              <div className="space-y-6">
                <div className="flex justify-between items-end px-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Input Source</h3>
                    <button onClick={() => setShowHelp(!showHelp)} className="text-slate-300 hover:text-blue-500 transition-colors">
                      <HelpCircle size={14} />
                    </button>
                  </div>
                  <button onClick={handleClear} className="text-xs font-bold text-red-500 hover:underline">Clear</button>
                </div>
                
                <AnimatePresence>
                  {showHelp && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 text-[10px] font-medium text-slate-500 uppercase tracking-wider leading-relaxed">
                        Supports standard percent-encoding and Base64 (UTF-8 safe). Use "Swap" to chain operations like B64 decoding an encoded URL.
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative">
                  <textarea
                    className="w-full h-64 p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white font-mono text-sm leading-relaxed outline-none resize-none shadow-inner"
                    placeholder={`Paste text to ${mode}...`}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <div className="absolute bottom-6 right-8 text-[10px] font-black text-slate-300">
                    LENGTH: {text.length}
                  </div>
                </div>

                <button
                  onClick={handleProcess}
                  className="btn-primary w-full py-5 text-lg shadow-blue-500/25"
                >
                  <RefreshCw size={20} className={text && !result ? "animate-spin" : ""} />
                  Execute Transformation
                </button>
              </div>

              {/* Output Workspace */}
              <div className="space-y-6">
                <div className="flex justify-between items-end px-2">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Result Output</h3>
                  <div className="flex gap-4">
                    <button onClick={handleSwap} disabled={!result} className="text-xs font-bold text-blue-600 hover:underline disabled:opacity-30">Swap Input</button>
                    <button onClick={() => setShowStats(!showStats)} className="text-xs font-bold text-slate-500 hover:underline">Analysis</button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    className="w-full h-64 p-8 rounded-[2rem] bg-slate-100/50 dark:bg-slate-800/50 border-none text-slate-900 dark:text-white font-mono text-sm leading-relaxed outline-none resize-none"
                    placeholder="Results will appear here..."
                    value={result}
                    readOnly
                  />
                  <AnimatePresence>
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center bg-red-500/10 backdrop-blur-sm rounded-[2rem]"
                      >
                        <p className="px-6 py-3 bg-white dark:bg-slate-900 text-red-500 font-bold rounded-xl shadow-xl border border-red-500/20">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex gap-4">
                  <button onClick={handleCopy} disabled={!result} className="flex-1 py-4 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black text-xs uppercase tracking-widest disabled:opacity-30 transition-all hover:opacity-90 flex items-center justify-center gap-2">
                    <ClipboardCopy size={16} /> Copy
                  </button>
                  <button onClick={handleDownload} disabled={!result} className="flex-1 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 font-black text-xs uppercase tracking-widest disabled:opacity-30 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2">
                    <Download size={16} /> Download
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <AnimatePresence>
              {showStats && result && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="mt-10 overflow-hidden"
                >
                  <div className="p-8 rounded-[2rem] bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/20 grid grid-cols-2 md:grid-cols-4 gap-8">
                    <Stat label="Original" value={stats.originalLength} />
                    <Stat label="Output" value={stats.resultLength} />
                    <Stat label="Variance" value={`${stats.difference > 0 ? '+' : ''}${stats.difference}`} />
                    <Stat label="Ratio" value={`${stats.percentageChange}%`} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* History */}
            {history.length > 0 && (
              <div className="mt-20 pt-12 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-8 px-2">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">Session Logs</h3>
                  <button onClick={clearHistory} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Flush Logs</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {history.map((item, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => loadFromHistory(item)}
                      className="p-5 rounded-[1.5rem] glass hover:border-blue-500/50 cursor-pointer group transition-all"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-600 text-white uppercase tracking-tighter">{item.mode}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">{item.input}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <ToolSupportSection currentPath="/tools/url-encoder" category="Dev Tools" />
      </div>

      {popupMessage && (
        <div className="fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl bg-slate-900 text-white shadow-2xl flex items-center gap-3 animate-slide-up">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-sm font-bold uppercase tracking-widest">{popupMessage}</span>
        </div>
      )}
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
    <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
  </div>
);

export default UrlTool;
