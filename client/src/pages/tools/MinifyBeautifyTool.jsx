import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { js, css, html } from "js-beautify";
import SEO from "../../utils/SEO";
import ToolSupportSection from "../../components/ToolSupportSection";
import { Copy, Download, Check, Zap } from "lucide-react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-css";
import { statsApi } from "../../utils/apiClient";

const MinifyBeautifyTool = () => {
  const [code, setCode] = useState("");
  const [result, setResult] = useState("");
  const [language, setLanguage] = useState("js");
  const [popupMessage, setPopupMessage] = useState("");
  const [indentSize] = useState(2);
  const [previewVisible, setPreviewVisible] = useState(true);
  const [preserveNewlines] = useState(true);
  const [beforeSize, setBeforeSize] = useState(0);
  const [afterSize, setAfterSize] = useState(0);
  const [copyState, setCopyState] = useState("idle");
  const [highlightedInput, setHighlightedInput] = useState("");

  const iframeRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setBeforeSize(new Blob([code]).size);
    highlightCode(code, language, setHighlightedInput);
  }, [code, language]);

  const highlightCode = (codeToHighlight, lang, setterFunction) => {
    if (!codeToHighlight) {
      setterFunction("");
      return;
    }
    const grammar = lang === "js" ? Prism.languages.javascript : lang === "css" ? Prism.languages.css : Prism.languages.markup;
    const highlighted = Prism.highlight(codeToHighlight, grammar, lang);
    setterFunction(highlighted);
  };

  const updatePreview = useCallback(() => {
    if (iframeRef.current) {
      let previewContent = result;
      if (language === "css") {
        previewContent = `<style>${result}</style><div style="font-family: Inter, sans-serif; padding: 40px;">
          <h1 style="font-weight: 900; letter-spacing: -0.05em; font-size: 3rem;">CSS Preview</h1>
          <p style="color: #64748b;">This environment reflects your active styling.</p>
          <div class="preview-box" style="margin-top: 30px; padding: 30px; border-radius: 20px; border: 1px solid #e2e8f0; background: #f8fafc;">
            <h2 style="margin-bottom: 10px;">Sample Component</h2>
            <button style="padding: 10px 20px; border-radius: 10px; cursor: pointer;">Action Button</button>
          </div>
        </div>`;
      }
      iframeRef.current.srcdoc = previewContent;
    }
  }, [result, language]);

  useEffect(() => {
    setAfterSize(new Blob([result]).size);
    if ((language === "html" || language === "css") && result) {
      updatePreview();
    }
  }, [result, language, updatePreview]);

  const handleBeautify = async () => {
    if (!code.trim()) return;
    try {
      const options = { indent_size: indentSize, preserve_newlines: preserveNewlines, max_preserve_newlines: 2 };
      let formatted;
      if (language === "js") formatted = js(code, options);
      else if (language === "css") formatted = css(code, options);
      else formatted = html(code, options);
      
      setResult(formatted);
      showPopup("Formatted successfully");
      statsApi.increment({ toolName: `beautify-${language}`, fileSize: code.length }).catch(() => {});
    } catch {
      showPopup("Formatting failed");
    }
  };

  const handleMinify = async () => {
    if (!code.trim()) return;
    try {
      let minified = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/mg, '').replace(/\s+/g, ' ').trim();
      if (language === "css") minified = minified.replace(/\s*([:;,{}])\s*/g, '$1').replace(/;}/g, '}');
      if (language === "html") minified = minified.replace(/<!--[\s\S]*?-->/g, '').replace(/>\s+</g, '><');
      
      setResult(minified);
      showPopup("Minified successfully");
      statsApi.increment({ toolName: `minify-${language}`, fileSize: code.length }).catch(() => {});
    } catch {
      showPopup("Minification failed");
    }
  };

  const showPopup = (msg) => {
    setPopupMessage(msg);
    setTimeout(() => setPopupMessage(""), 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopyState("copied");
    setTimeout(() => setCopyState("idle"), 2000);
    showPopup("Copied!");
  };

  const handleClear = () => {
    setCode(""); setResult("");
  };

  return (
    <div className="pb-20">
      <SEO 
        seoData={{
          title: 'Code Optimizer Pro - Minify & Beautify JS, CSS, HTML',
          description: 'Professional grade code formatter and minifier. Reduce file sizes or beautify messy code instantly with real-time preview.',
          keywords: 'js minifier, css beautifier, html formatter, code optimization, developer productivity',
          canonicalUrl: '/tools/minify-beautify',
          ogType: 'website',
        }}
      />

      {/* Header */}
      <section className="text-center py-12 md:py-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 text-[10px] font-black uppercase tracking-widest border border-pink-500/20 mb-6">
          <span className="material-icons text-xs">auto_awesome</span>
          Developer Productivity
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 leading-tight text-slate-900 dark:text-white">
          Code <span className="gradient-text">Refinery</span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed font-medium">
          Compress, beautify, and refine your source code with industry-standard algorithms.
        </p>
      </section>

      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Editor Side */}
        <div className="lg:col-span-7 space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="glass-card p-1 overflow-hidden"
          >
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-10 shadow-inner">
              <div className="flex items-center justify-between mb-8">
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  {["js", "css", "html"].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        language === lang 
                          ? 'bg-white dark:bg-slate-700 text-pink-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
                <div className="flex gap-4">
                  <input type="file" ref={fileInputRef} onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => { setCode(ev.target.result); };
                      reader.readAsText(file);
                    }
                  }} className="hidden" />
                  <button onClick={() => fileInputRef.current.click()} className="text-[10px] font-black uppercase text-slate-400 hover:text-pink-600 transition-colors">Import</button>
                  <button onClick={handleClear} className="text-[10px] font-black uppercase text-red-500 hover:underline">Flush</button>
                </div>
              </div>

              <div className="relative group rounded-3xl overflow-hidden bg-slate-900 shadow-2xl">
                <textarea
                  className="w-full h-[400px] p-8 font-mono text-xs leading-relaxed outline-none resize-none bg-transparent text-transparent caret-white z-10 relative"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={`// Paste your ${language.toUpperCase()} here...`}
                  spellCheck="false"
                />
                <div 
                  className="absolute inset-0 p-8 font-mono text-xs leading-relaxed pointer-events-none whitespace-pre overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: highlightedInput || `<span class="opacity-30">Waiting for code...</span>` }}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button onClick={handleBeautify} className="btn-primary flex-1 !bg-pink-600 shadow-pink-500/25 py-4">
                  <Zap size={18} /> Beautify Code
                </button>
                <button onClick={handleMinify} className="px-8 py-4 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all flex-1">
                  Minify Bundle
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Output Side */}
        <div className="lg:col-span-5 space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="glass-card p-1 overflow-hidden"
          >
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-10 h-full flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Processed Output</h3>
                <div className="flex gap-2">
                  <button onClick={handleCopy} className="p-3 rounded-xl glass hover:text-pink-600 transition-all">
                    {copyState === 'copied' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                  <button onClick={() => {
                    const blob = new Blob([result], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `optimized.${language}`;
                    a.click();
                  }} className="p-3 rounded-xl glass hover:text-pink-600 transition-all">
                    <Download size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 rounded-3xl overflow-hidden bg-slate-900 p-6 mb-8 shadow-inner">
                <pre className="text-[10px] font-mono leading-relaxed text-pink-400 overflow-auto h-full scrollbar-hide">
                  {result || 'The optimized code will appear here...'}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StatBox label="Size Saved" value={`${beforeSize > 0 && afterSize > 0 ? (100 - (afterSize / beforeSize * 100)).toFixed(1) : 0}%`} color="text-green-500" />
                <StatBox label="Lines" value={result ? result.split('\n').length : 0} />
              </div>
            </div>
          </motion.div>

          {/* Preview Panel */}
          {(language === 'html' || language === 'css') && result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="glass-card p-1 overflow-hidden"
            >
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Runtime Preview</h3>
                  <button onClick={() => setPreviewVisible(!previewVisible)} className="text-pink-600 text-[10px] font-black uppercase">
                    {previewVisible ? 'Disable' : 'Enable'}
                  </button>
                </div>
                {previewVisible && (
                  <div className="rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-white">
                    <iframe ref={iframeRef} title="preview" className="w-full h-48 border-none" sandbox="allow-scripts" />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <ToolSupportSection currentPath="/tools/minify-beautify" category="Dev Tools" />
      </div>

      {popupMessage && (
        <div className="fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl bg-slate-900 text-white shadow-2xl flex items-center gap-3 animate-slide-up">
          <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
          <span className="text-sm font-bold uppercase tracking-widest">{popupMessage}</span>
        </div>
      )}
    </div>
  );
};

const StatBox = ({ label, value, color = "text-slate-900 dark:text-white" }) => (
  <div className="p-4 rounded-2xl glass border-none">
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
    <p className={`text-lg font-black ${color}`}>{value}</p>
  </div>
);

StatBox.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  color: PropTypes.string,
};

export default MinifyBeautifyTool;
