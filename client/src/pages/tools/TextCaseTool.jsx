import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Popup from "../../components/Popup";
import SEO from "../../utils/SEO";
import { ClipboardCopy, Download, RotateCcw, Type } from "lucide-react";
import { statsApi } from "../../utils/apiClient";

const TextCaseTool = () => {
  const [text, setText] = useState("");
  const [convertedText, setConvertedText] = useState("");
  const [popupMessage, setPopupMessage] = useState("");

  const showPopup = (message) => {
    setPopupMessage(message);
    setTimeout(() => setPopupMessage(""), 2000);
  };

  const handleTransform = (transformFn, label) => {
    const result = transformFn(text);
    setConvertedText(result);
    
    // Log conversion
    statsApi.increment({
      toolName: `text-case-${label}`,
      fileSize: text.length
    }).catch(err => console.error('Failed to log stats:', err));
  };

  const toUpperCase = () => handleTransform(t => t.toUpperCase(), 'upper');
  const toLowerCase = () => handleTransform(t => t.toLowerCase(), 'lower');
  const toCapitalize = () => handleTransform(t => t.replace(/\b\w/g, c => c.toUpperCase()), 'capitalize');
  const toSentenceCase = () => handleTransform(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase(), 'sentence');

  const handleCopy = () => {
    navigator.clipboard.writeText(convertedText);
    showPopup("Copied to clipboard!");
  };

  const handleDownload = () => {
    const blob = new Blob([convertedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted_text.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showPopup("File downloaded!");
  };

  return (
    <div className="pb-20">
      <SEO 
        seoData={{
          title: 'Text Case Converter Pro - Instant Case Transformation',
          description: 'Convert text to UPPERCASE, lowercase, Capitalize, or Sentence case instantly with our professional text tool.',
          keywords: 'text case converter, uppercase, lowercase, capitalize, sentence case, string manipulation',
          canonicalUrl: '/tools/text-case-converter',
          ogType: 'website',
        }}
      />

      {/* Header */}
      <section className="text-center py-12 md:py-16" data-aos="fade-down">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-600/10 text-green-600 dark:text-green-400 text-[10px] font-black uppercase tracking-widest border border-green-600/20 mb-6">
          <span className="material-icons text-xs">text_fields</span>
          Content Refiner
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 leading-tight text-slate-900 dark:text-white">
          Text <span className="text-green-600">Transformer</span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed font-medium">
          The ultimate workspace for refining, cleaning, and transforming your text-based content.
        </p>
      </section>

      <div className="max-w-4xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-1 overflow-hidden"
        >
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-10 shadow-inner">
            {/* Input Workspace */}
            <div className="space-y-6">
              <div className="flex justify-between items-end px-2">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Input Content</h3>
                <button onClick={() => {setText(""); setConvertedText("");}} className="text-xs font-bold text-red-500 hover:underline">Clear All</button>
              </div>

              <textarea
                className="w-full h-64 p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-green-500/50 focus:bg-white transition-all text-slate-900 dark:text-white font-medium text-sm leading-relaxed outline-none resize-none shadow-inner"
                placeholder="Type or paste your text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />

              {/* Transformation Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={toUpperCase}
                  className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent hover:border-green-500/50 hover:bg-white dark:hover:bg-slate-700 transition-all group"
                >
                  <span className="text-lg font-black group-hover:scale-110 transition-transform">AA</span>
                  <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Uppercase</span>
                </button>
                <button
                  onClick={toLowerCase}
                  className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent hover:border-green-500/50 hover:bg-white dark:hover:bg-slate-700 transition-all group"
                >
                  <span className="text-lg font-black group-hover:scale-110 transition-transform">aa</span>
                  <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Lowercase</span>
                </button>
                <button
                  onClick={toCapitalize}
                  className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent hover:border-green-500/50 hover:bg-white dark:hover:bg-slate-700 transition-all group"
                >
                  <span className="text-lg font-black group-hover:scale-110 transition-transform">Aa Bb</span>
                  <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Capitalize</span>
                </button>
                <button
                  onClick={toSentenceCase}
                  className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent hover:border-green-500/50 hover:bg-white dark:hover:bg-slate-700 transition-all group"
                >
                  <span className="text-lg font-black group-hover:scale-110 transition-transform">Aa aa</span>
                  <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Sentence</span>
                </button>
              </div>
            </div>

            {/* Output Workspace */}
            <AnimatePresence>
              {convertedText && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-12 pt-12 border-t border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between mb-8 px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white shadow-lg">
                        <Type size={16} />
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white">Refined Output</h3>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={handleCopy} className="p-3 rounded-xl glass hover:text-green-600 transition-all">
                        <ClipboardCopy size={18} />
                      </button>
                      <button onClick={handleDownload} className="p-3 rounded-xl glass hover:text-green-600 transition-all">
                        <Download size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-50 dark:bg-slate-800 p-8 shadow-inner border border-slate-100 dark:border-slate-700/30">
                    <pre className="text-slate-900 dark:text-white font-medium text-sm leading-relaxed whitespace-pre-wrap">
                      {convertedText}
                    </pre>
                  </div>

                  <div className="mt-8 flex gap-8 px-4">
                    <StatItem label="Characters" value={convertedText.length} />
                    <StatItem label="Words" value={convertedText.split(/\s+/).filter(x => x).length} />
                    <StatItem label="Lines" value={convertedText.split('\n').length} />
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

const StatItem = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
    <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{value}</p>
  </div>
);

export default TextCaseTool;
