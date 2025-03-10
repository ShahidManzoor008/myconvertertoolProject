import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Popup from "../../components/Popup";
import { js, css, html } from "js-beautify";
import { Helmet } from "react-helmet-async";
import { Copy, Download, Eye, EyeOff, Upload, Code, Check, Info, Moon, Sun, X } from "lucide-react"; // Added X icon for clear button
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css"; // Dark theme
import "prismjs/themes/prism.css"; // Light theme
// Import language components
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markup"; // HTML

const MinifyBeautifyTool = () => {
  const [code, setCode] = useState("");
  const [result, setResult] = useState("");
  const [language, setLanguage] = useState("js");
  const [popupMessage, setPopupMessage] = useState("");
  const [indentSize, setIndentSize] = useState(2);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(true);
  const [fileDetails, setFileDetails] = useState(null);
  const [beforeSize, setBeforeSize] = useState(0);
  const [afterSize, setAfterSize] = useState(0);
  const [copyState, setCopyState] = useState("idle");
  const [theme, setTheme] = useState("dark");
  const [highlightedInput, setHighlightedInput] = useState("");
  const [highlightedOutput, setHighlightedOutput] = useState("");
  const [editorFocused, setEditorFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // Added for active typing indication

  const iframeRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const codeEditorRef = useRef(null);

  // Map our language values to Prism's language classes
  const prismLanguageMap = {
    "js": "language-javascript",
    "css": "language-css",
    "html": "language-markup"
  };

  useEffect(() => {
    // Check system preference for theme
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
    
    // Set before size whenever code changes
    setBeforeSize(new Blob([code]).size);
    
    // Highlight the input code when it changes
    highlightCode(code, language, setHighlightedInput);
    
    // Update preview when result or language changes
    if ((language === "html" || language === "css") && result) {
      updatePreview();
    }
  }, [code, language]);

  useEffect(() => {
    // Highlight the output code when it changes
    highlightCode(result, language, setHighlightedOutput);
    
    // Set after size whenever result changes
    setAfterSize(new Blob([result]).size);
  }, [result, language]);

  // Use Prism to highlight code
  const highlightCode = (codeToHighlight, lang, setterFunction) => {
    if (!codeToHighlight) {
      setterFunction("");
      return;
    }
    
    let grammar;
    switch (lang) {
      case "js":
        grammar = Prism.languages.javascript;
        break;
      case "css":
        grammar = Prism.languages.css;
        break;
      case "html":
        grammar = Prism.languages.markup;
        break;
      default:
        grammar = Prism.languages.javascript;
    }
    
    const highlighted = Prism.highlight(codeToHighlight, grammar, lang);
    setterFunction(highlighted);
  };

  const showPopup = (message) => {
    setPopupMessage(message);
    setTimeout(() => setPopupMessage(""), 2000);
  };

  const getBeautifyOptions = () => {
    const options = { 
      indent_size: indentSize,
      // Common options for all languages
      preserve_newlines: true,
      max_preserve_newlines: 2,
      wrap_line_length: 0,
    };

    // Language-specific options
    if (language === "js") {
      options.brace_style = "collapse";
      options.space_in_paren = false;
      options.space_in_empty_paren = false;
    } else if (language === "html") {
      options.indent_inner_html = true;
      options.extra_liners = [];
      options.unformatted = ['code', 'pre', 'em', 'strong', 'span'];
    }
    
    return options;
  };

  const handleBeautify = () => {
    if (!code.trim()) {
      showPopup("Please enter some code first");
      return;
    }
    
    const options = getBeautifyOptions();
    let formattedCode;
    
    try {
      if (language === "js") formattedCode = js(code, options);
      else if (language === "css") formattedCode = css(code, options);
      else if (language === "html") formattedCode = html(code, options);
      
      setResult(formattedCode);
      setAfterSize(new Blob([formattedCode]).size);
      showPopup("Code beautified successfully!");
    } catch (error) {
      showPopup(`Error: ${error.message}`);
    }
  };

  const handleMinify = () => {
    if (!code.trim()) {
      showPopup("Please enter some code first");
      return;
    }
    
    let minifiedCode;
    
    try {
      if (language === "js") {
        // Basic JS minification (removal of whitespace and comments)
        minifiedCode = code
          .replace(/\/\*[\s\S]*?\*\/|\/\/.*$/mg, '') // Remove comments
          .replace(/\s+/g, ' ') // Replace whitespace with a single space
          .trim();
      } else if (language === "css") {
        // Basic CSS minification
        minifiedCode = code
          .replace(/\/\*[\s\S]*?\*\/|\/\/.*$/mg, '')
          .replace(/\s+/g, ' ')
          .replace(/\s*([:;,{}])\s*/g, '$1')
          .replace(/;}/g, '}')
          .trim();
      } else if (language === "html") {
        // Basic HTML minification
        minifiedCode = code
          .replace(/<!--[\s\S]*?-->/g, '')
          .replace(/\s+/g, ' ')
          .replace(/>\s+</g, '><')
          .trim();
      }
      
      setResult(minifiedCode);
      setAfterSize(new Blob([minifiedCode]).size);
      showPopup("Code minified successfully!");
    } catch (error) {
      showPopup(`Error: ${error.message}`);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopyState("copied");
    showPopup("Copied to clipboard!");
    
    setTimeout(() => {
      setCopyState("idle");
    }, 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const filename = fileDetails ? fileDetails.name : `formatted_code.${language}`;
    
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Clean up
    
    showPopup("File downloaded!");
  };

  const updatePreview = () => {
    if (iframeRef.current) {
      let previewContent = result;
      if (language === "css") {
        previewContent = `
          <style>${result}</style>
          <div style="font-family: system-ui, sans-serif; padding: 20px;">
            <h1 style="color: #333;">CSS Preview</h1>
            <p>This preview shows how your CSS will look. The styling below is affected by your CSS.</p>
            <div class="preview-element" style="padding: 20px; border: 1px solid #ddd; margin-top: 20px;">
              <h2>Sample Heading</h2>
              <p>Sample paragraph with <a href="#">link</a> and <strong>bold text</strong>.</p>
              <button>Sample Button</button>
            </div>
          </div>
        `;
      } else if (language === "html") {
        previewContent = result;
      }
      iframeRef.current.srcdoc = previewContent;
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Extract file extension and set language
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (fileExt === 'js' || fileExt === 'jsx' || fileExt === 'json') {
      setLanguage('js');
    } else if (fileExt === 'css') {
      setLanguage('css');
    } else if (fileExt === 'html' || fileExt === 'htm') {
      setLanguage('html');
    }
    
    setFileDetails(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setCode(e.target.result);
      setResult('');
    };
    reader.readAsText(file);
  };

  const triggerFileUpload = () => {
    fileInputRef.current.click();
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const calculateSavings = () => {
    if (beforeSize === 0 || afterSize === 0) return 0;
    return ((beforeSize - afterSize) / beforeSize * 100).toFixed(1);
  };

  // Handle textarea input and maintain cursor position
  const handleTextareaChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    
    // The cursor position will be maintained automatically 
    // by using the native textarea
  };

  // Sync scroll between textarea and highlighted code display
  const handleScroll = (e) => {
    if (codeEditorRef.current && textareaRef.current) {
      codeEditorRef.current.scrollTop = e.target.scrollTop;
      codeEditorRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  // Generate line numbers for the output code
  const generateLineNumbers = (code) => {
    const lines = code.split('\n').length;
    return Array.from({ length: lines }, (_, i) => i + 1).join('\n');
  };

  // Clear the input and result
  const handleClear = () => {
    setCode("");
    setResult("");
    setFileDetails(null);
    setBeforeSize(0);
    setAfterSize(0);
    setHighlightedInput("");
    setHighlightedOutput("");
    showPopup("Cleared!");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
      className={`p-6 max-w-6xl mx-auto ${theme === 'dark' ? 'dark' : ''}`}
    >
      <Helmet>
        <title>Free Code Minifier & Beautifier - Minify JS, CSS, HTML</title>
        <meta name="description" content="Use our Free Online Minifier & Beautifier to minify JavaScript, CSS, and HTML code. Reduce file size, improve performance, and beautify code for readability!" />
        <meta name="keywords" content="JS minifier, CSS minifier, HTML beautifier, JavaScript beautifier, free code beautifier, minify code online, online code minifier, developer tools, free online tools" />
        <meta property="og:title" content="Free Code Minifier & Beautifier - Minify JS, CSS, HTML" />
        <meta property="og:description" content="Use our Free Online Minifier & Beautifier to minify JavaScript, CSS, and HTML code. Reduce file size, improve performance, and beautify code for readability!" />
        <meta property="og:url" content="https://myconvertertool.com/tools/minify-beautify" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">Minify & Beautify Code</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Format or Minify your JavaScript, CSS, or HTML with Syntax Highlighting</p>
        </div>
        
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="flex gap-2">
              {["js", "css", "html"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-4 py-2 rounded-md font-medium text-sm ${
                    language === lang 
                      ? "bg-blue-500 text-white" 
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  } transition`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
            
            <div className="flex items-center">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept=".js,.jsx,.json,.css,.html,.htm"
              />
              <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }} 
                onClick={triggerFileUpload}
                className="flex items-center gap-2 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm"
              >
                <Upload size={16} />
                Upload File
              </motion.button>
            </div>
          </div>
          
          {fileDetails && (
            <div className="mb-3 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md text-sm flex items-center gap-2">
              <Info size={16} />
              <span>
                File: <strong>{fileDetails.name}</strong> ({(fileDetails.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          )}
          
          {/* Code Editor with Syntax Highlighting */}
          <div className="relative border rounded-md overflow-hidden border-gray-300 dark:border-gray-600 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <div 
              ref={codeEditorRef}
              className={`absolute top-0 left-0 right-0 bottom-0 font-mono text-sm p-4 whitespace-pre overflow-auto pointer-events-none ${
                prismLanguageMap[language]
              } ${
                theme === 'dark' ? 'code-editor-dark' : 'code-editor-light'
              }`}
              dangerouslySetInnerHTML={{ __html: highlightedInput || '<span style="opacity: 0.5;">Paste your code here...</span>' }}
            />
            <textarea 
              ref={textareaRef}
              className="w-full h-64 p-4 font-mono text-sm bg-transparent resize-none outline-none text-transparent caret-gray-900 dark:caret-white"
              value={code} 
              onChange={handleTextareaChange}
              onScroll={handleScroll}
              onFocus={() => setEditorFocused(true)}
              onBlur={() => setEditorFocused(false)}
              spellCheck="false"
              placeholder={`Paste your ${language.toUpperCase()} code here...`}
            />
          </div>
          
          {/* Advanced Options Toggle */}
          <div className="mt-4 mb-2">
            <button 
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="text-blue-500 dark:text-blue-400 text-sm flex items-center gap-1"
            >
              <Code size={16} />
              {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
            </button>
          </div>
          
          {/* Advanced Options Panel */}
          {showAdvancedOptions && (
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md mb-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Indent Size:
                  <select 
                    value={indentSize} 
                    onChange={(e) => setIndentSize(Number(e.target.value))}
                    className="ml-2 p-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value={2}>2 spaces</option>
                    <option value={4}>4 spaces</option>
                    <option value={8}>8 spaces</option>
                  </select>
                </label>
                
                {/* Add more options here based on language */}
                {language === "js" && (
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <input 
                      type="checkbox" 
                      id="preserve-newlines" 
                      defaultChecked 
                      className="mr-2"
                    />
                    <label htmlFor="preserve-newlines">Preserve line breaks</label>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-4 mt-4">
            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              onClick={handleBeautify} 
              className="w-1/2 bg-green-500 text-white py-3 rounded-md hover:bg-green-600 transition font-medium flex items-center justify-center gap-2"
            >
              <Code size={18} />
              Beautify
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              onClick={handleMinify} 
              className="w-1/2 bg-red-500 text-white py-3 rounded-md hover:bg-red-600 transition font-medium flex items-center justify-center gap-2"
            >
              <Code size={18} />
              Minify
            </motion.button>
          </div>

          {/* Clear Button */}
          <div className="mt-4">
            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              onClick={handleClear} 
              className="w-full bg-gray-500 text-white py-3 rounded-md hover:bg-gray-600 transition font-medium flex items-center justify-center gap-2"
            >
              <X size={18} />
              Clear
            </motion.button>
          </div>
        </div>
        
        {/* Output Section */}
        {result ? (
  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md shadow-md h-full flex flex-col">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Output:</h2>
      
      {beforeSize > 0 && afterSize > 0 && (
        <div className="flex items-center text-sm bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full">
          <span>
            Saved {calculateSavings()}% 
            ({(beforeSize / 1024).toFixed(1)}KB → {(afterSize / 1024).toFixed(1)}KB)
          </span>
        </div>
      )}
    </div>
    
    {/* Code Output with Syntax Highlighting */}
    <div className="flex-grow overflow-auto rounded-md bg-white dark:bg-gray-900 p-4" style={{ maxHeight: "calc(100vh - 300px)" }}>
      <div className="flex">
        {/* Line Numbers */}
        <div className="text-right pr-4 text-gray-400 dark:text-gray-500 select-none">
          <pre className="font-mono text-sm">
            {generateLineNumbers(result)}
          </pre>
        </div>
        {/* Highlighted Code */}
        <div className="flex-grow">
          <pre 
            className={`font-mono text-sm whitespace-pre-wrap ${prismLanguageMap[language]} ${theme === 'dark' ? 'code-dark' : 'code-light'}`}
            dangerouslySetInnerHTML={{ __html: highlightedOutput }}
          />
        </div>
      </div>
    </div>
    
    {/* Copy & Download Buttons */}
    <div className="flex gap-4 mt-4">
      <motion.button 
        whileHover={{ scale: 1.05 }} 
        whileTap={{ scale: 0.95 }} 
        onClick={handleCopy} 
        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition ${
          copyState === 'copied' 
            ? 'bg-green-500 text-white' 
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        {copyState === 'copied' ? <Check size={18} /> : <Copy size={18} />}
        {copyState === 'copied' ? 'Copied!' : 'Copy'}
      </motion.button>
      <motion.button 
        whileHover={{ scale: 1.05 }} 
        whileTap={{ scale: 0.95 }} 
        onClick={handleDownload} 
        className="flex-1 flex items-center justify-center gap-2 bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition"
      >
        <Download size={18} />
        Download
      </motion.button>
    </div>
  </div>
) : (
  <div className="h-full flex items-center justify-center p-8 bg-gray-100 dark:bg-gray-800 rounded-md">
    <div className="text-center text-gray-500 dark:text-gray-400">
      <Code size={48} className="mx-auto mb-4 opacity-40" />
      <p className="text-lg font-medium">Your formatted code will appear here</p>
      <p className="mt-2 text-sm">Paste your code and click "Beautify" or "Minify"</p>
    </div>
  </div>
)}
      </div>
      
      {/* Live Preview for HTML & CSS */}
      {(language === "html" || language === "css") && result && (
        <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded-md shadow-md">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Live Preview:</h2>
            <button 
              onClick={() => setPreviewVisible(!previewVisible)}
              className="text-blue-500 flex items-center gap-1 text-sm"
            >
              {previewVisible ? (
                <>
                  <EyeOff size={16} />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye size={16} />
                  Show Preview
                </>
              )}
            </button>
          </div>
          
          {previewVisible && (
            <div className="mt-4 border rounded-md bg-white overflow-hidden">
              <iframe 
                ref={iframeRef} 
                className="w-full h-64 border-0"
                title="Code Preview"
                sandbox="allow-scripts"
              />
            </div>
          )}
        </div>
      )}

      {/* Add custom styles for syntax highlighting themes */}
      <style>{`
        /* Override Prism themes for better contrast */
        .code-editor-light {
          background-color: white !important;
        }
        
        .code-editor-dark {
          background-color: #1e1e1e !important;
        }
        
        .code-light {
          background-color: white !important;
        }
        
        .code-dark {
          background-color: #1e1e1e !important;
        }
        
        /* Ensure proper text color in dark mode */
        .dark .code-dark .token.punctuation,
        .dark .code-dark .token.operator {
          color: #d4d4d4 !important;
        }
        
        /* Adjust the caret color based on theme */
        .dark textarea.caret-white {
          caret-color: white;
        }

        /* Smooth scrolling for textarea and code editor */
        textarea, .code-editor-light, .code-editor-dark {
          scroll-behavior: smooth;
        }

        /* Active typing indicator */
        .active-typing {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
        }
      `}</style>

      {/* Popup Notification */}
      {popupMessage && <Popup message={popupMessage} onClose={() => setPopupMessage("")} />}
    </motion.div>
  );
};

export default MinifyBeautifyTool;