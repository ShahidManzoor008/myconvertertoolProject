import { useToolWorkspace } from '../../hooks/useToolWorkspace';
import { useSearchParams } from 'react-router-dom';
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PropTypes from "prop-types";
import SEO from "../../utils/SEO";
import ToolSupportSection from "../../components/ToolSupportSection";
import { ClipboardCopy, Download, Type } from "lucide-react";
import { statsApi } from "../../utils/apiClient";

import { capitalizeWords, sentenceCase } from '../../utils/textAnalysis';

const TextCaseTool = () => {
  const workspaceRef = useToolWorkspace();
  const [searchParams] = useSearchParams();
  const requestedMode = ['uppercase', 'lowercase', 'title', 'sentence'].includes(searchParams.get('mode')) ? searchParams.get('mode') : '';
  const [selectedMode, setSelectedMode] = useState(requestedMode);
  const [text, setText] = useState("");
  const [convertedText, setConvertedText] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [copyError, setCopyError] = useState("");

  const showPopup = (message) => {
    setPopupMessage(message);
    setTimeout(() => setPopupMessage(""), 2000);
  };

  const handleTransform = (transformFn, label) => {
    setSelectedMode({ upper: 'uppercase', lower: 'lowercase', capitalize: 'title', sentence: 'sentence' }[label]);
    if (!text.trim()) { setConvertedText(""); showPopup("Enter text to transform."); return; }
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
  const toCapitalize = () => handleTransform(capitalizeWords, 'capitalize');
  const toSentenceCase = () => handleTransform(sentenceCase, 'sentence');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(convertedText);
      setCopyError("");
      showPopup("Copied to clipboard!");
    } catch { setCopyError("Clipboard access blocked. Select and copy the output manually."); }
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
      <section className="tool-intro text-center py-12 md:py-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-600/10 text-green-600 dark:text-green-400 text-[10px] font-black uppercase tracking-widest border border-green-600/20 mb-6">
          <span aria-hidden="true" className="material-icons text-xs">text_fields</span>
          Content Refiner
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 leading-tight text-slate-900 dark:text-white">
          Text <span className="text-green-600">Case Converter</span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed font-medium">
          The ultimate workspace for refining, cleaning, and transforming your text-based content.
        </p>
      </section>

      <div ref={workspaceRef} id="tool-workspace" tabIndex={-1} role="region" aria-label="Tool workspace" className="max-w-4xl mx-auto px-4">
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

              <textarea aria-label="Text input"
                className="w-full h-64 p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-green-500/50 focus:bg-white transition-all text-slate-900 dark:text-white font-medium text-sm leading-relaxed outline-none resize-none shadow-inner"
                placeholder="Type or paste your text here..."
                value={text}
                onChange={(e) => { setText(e.target.value); setConvertedText(""); }}
              />

              {/* Transformation Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={toUpperCase}
                  className={`flex flex-col items-center gap-2 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 hover:border-green-500/50 hover:bg-white dark:hover:bg-slate-700 transition-all group ${selectedMode === 'uppercase' ? 'border-green-500 ring-2 ring-green-500/20' : 'border-transparent'}`}
                >
                  <span className="text-lg font-black group-hover:scale-110 transition-transform">AA</span>
                  <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Uppercase</span>
                </button>
                <button
                  type="button"
                  onClick={toLowerCase}
                  className={`flex flex-col items-center gap-2 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 hover:border-green-500/50 hover:bg-white dark:hover:bg-slate-700 transition-all group ${selectedMode === 'lowercase' ? 'border-green-500 ring-2 ring-green-500/20' : 'border-transparent'}`}
                >
                  <span className="text-lg font-black group-hover:scale-110 transition-transform">aa</span>
                  <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Lowercase</span>
                </button>
                <button
                  type="button"
                  onClick={toCapitalize}
                  className={`flex flex-col items-center gap-2 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 hover:border-green-500/50 hover:bg-white dark:hover:bg-slate-700 transition-all group ${selectedMode === 'title' ? 'border-green-500 ring-2 ring-green-500/20' : 'border-transparent'}`}
                >
                  <span className="text-lg font-black group-hover:scale-110 transition-transform">Aa Bb</span>
                  <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Capitalize</span>
                </button>
                <button
                  type="button"
                  onClick={toSentenceCase}
                  className={`flex flex-col items-center gap-2 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 hover:border-green-500/50 hover:bg-white dark:hover:bg-slate-700 transition-all group ${selectedMode === 'sentence' ? 'border-green-500 ring-2 ring-green-500/20' : 'border-transparent'}`}
                >
                  <span className="text-lg font-black group-hover:scale-110 transition-transform">Aa aa</span>
                  <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Sentence</span>
                </button>
              </div>
            </div>

            {copyError && <p role="alert" className="mt-4 text-sm text-red-600">{copyError}</p>}
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
                      <button aria-label="Copy result" onClick={handleCopy} className="p-3 rounded-xl glass hover:text-green-600 transition-all">
                        <ClipboardCopy size={18} />
                      </button>
                      <button aria-label="Download result" onClick={handleDownload} className="p-3 rounded-xl glass hover:text-green-600 transition-all">
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

      <div className="max-w-6xl mx-auto px-4">
        <ToolSupportSection currentPath="/tools/text-case-converter" category="Text Tools" />
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

StatItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default TextCaseTool;
