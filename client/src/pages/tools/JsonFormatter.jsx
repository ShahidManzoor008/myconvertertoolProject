import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SEO from '../../utils/SEO';
import Popup from "../../components/Popup";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";
// 'atomOneDark' is not exported from the prism styles in this package version.
// Use 'oneDark' (or 'atomDark') which are the actual exported names.
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FaCopy, FaDownload, FaSun, FaMoon, FaCheck, FaTimes } from "react-icons/fa";

const JsonFormatter = () => {
  const [jsonInput, setJsonInput] = useState("");
  const [formattedJson, setFormattedJson] = useState("");
  const [error, setError] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("jsonFormatterDarkMode");
    return saved === "true" || (saved === null && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });
  const [indentSize, setIndentSize] = useState(2);
  const [activeTab, setActiveTab] = useState("format");
  const [jsonStats, setJsonStats] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [recentUploads, setRecentUploads] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Apply dark mode from saved preference
  useEffect(() => {
    localStorage.setItem("jsonFormatterDarkMode", isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Load recent uploads from localStorage
  useEffect(() => {
    const savedUploads = localStorage.getItem("jsonFormatterRecentUploads");
    if (savedUploads) {
      setRecentUploads(JSON.parse(savedUploads));
    }
  }, []);

  const showPopup = (message) => {
    setPopupMessage(message);
    setTimeout(() => setPopupMessage(""), 2000);
  };

  const handleFormatJson = () => {
    try {
      const parsedJson = JSON.parse(jsonInput);
      setFormattedJson(JSON.stringify(parsedJson, null, indentSize));
      setError("");
      analyzeJson(parsedJson);
      validateJson(parsedJson);
    } catch (error) {
      setError(`Invalid JSON: ${error.message}`);
      setFormattedJson("");
      setJsonStats(null);
      setValidationResults(null);
    }
  };

  const handleMinifyJson = () => {
    try {
      const parsedJson = JSON.parse(jsonInput);
      setFormattedJson(JSON.stringify(parsedJson));
      setError("");
      analyzeJson(parsedJson);
      validateJson(parsedJson);
    } catch (error) {
      setError(`Invalid JSON: ${error.message}`);
      setFormattedJson("");
      setJsonStats(null);
      setValidationResults(null);
    }
  };

  const analyzeJson = (json) => {
    try {
      const jsonString = JSON.stringify(json);
      
      // Count object types recursively
      const typeCounts = {
        objects: 0,
        arrays: 0,
        strings: 0,
        numbers: 0,
        booleans: 0,
        nulls: 0
      };
      
      const countTypes = (item) => {
        if (item === null) {
          typeCounts.nulls++;
        } else if (typeof item === "object" && !Array.isArray(item)) {
          typeCounts.objects++;
          Object.values(item).forEach(countTypes);
        } else if (Array.isArray(item)) {
          typeCounts.arrays++;
          item.forEach(countTypes);
        } else if (typeof item === "string") {
          typeCounts.strings++;
        } else if (typeof item === "number") {
          typeCounts.numbers++;
        } else if (typeof item === "boolean") {
          typeCounts.booleans++;
        }
      };
      
      countTypes(json);
      
      const stats = {
        size: jsonString.length,
        readableSize: formatSize(jsonString.length),
        minifiedSize: JSON.stringify(json).length,
        readableMinifiedSize: formatSize(JSON.stringify(json).length),
        typeCounts
      };
      
      setJsonStats(stats);
    } catch (error) {
      console.error("Error analyzing JSON:", error);
    }
  };
  
  const formatSize = (bytes) => {
    if (bytes < 1024) {
      return `${bytes} bytes`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  };

  const validateJson = (json) => {
    // Perform deeper validation checks
    const results = {
      validations: [],
      score: 0,
      maxScore: 0
    };
    
    // Check 1: No duplicate keys in objects
    try {
      let hasDuplicates = false;
      const checkDuplicateKeys = (obj) => {
        if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
          return;
        }

        const keys = [];
        for (const key in obj) {
          if (keys.includes(key)) {
            hasDuplicates = true;
            return;
          }
          keys.push(key);
          checkDuplicateKeys(obj[key]);
        }
      };

      checkDuplicateKeys(json);

      results.validations.push({
        name: "No duplicate keys",
        passed: !hasDuplicates,
        details: hasDuplicates ? "Found duplicate keys in JSON objects" : "No duplicate keys found"
      });
      
      results.score += !hasDuplicates ? 1 : 0;
      results.maxScore += 1;
    } catch {
      results.validations.push({
        name: "No duplicate keys",
        passed: false,
        details: "Unable to check for duplicate keys"
      });
      results.maxScore += 1;
    }
    
    // Check 2: Consistent property naming convention
    try {
      const propertyNames = [];
      const extractPropertyNames = (obj) => {
        if (obj === null || typeof obj !== "object") return;
        
        if (!Array.isArray(obj)) {
          Object.keys(obj).forEach(key => {
            propertyNames.push(key);
            extractPropertyNames(obj[key]);
          });
        } else {
          obj.forEach(item => extractPropertyNames(item));
        }
      };
      
      extractPropertyNames(json);
      
      // Detect conventions
      const conventions = {
        camelCase: propertyNames.filter(name => /^[a-z][a-zA-Z0-9]*$/.test(name) && name.match(/[A-Z]/) !== null).length,
        snakeCase: propertyNames.filter(name => /^[a-z][a-z0-9_]*$/.test(name) && name.includes('_')).length,
        kebabCase: propertyNames.filter(name => /^[a-z][a-z0-9-]*$/.test(name) && name.includes('-')).length,
        pascalCase: propertyNames.filter(name => /^[A-Z][a-zA-Z0-9]*$/.test(name)).length
      };
      
      const total = propertyNames.length;
      const dominant = Object.entries(conventions).sort((a, b) => b[1] - a[1])[0];
      const consistencyRatio = total > 0 ? dominant[1] / total : 1;
      
      results.validations.push({
        name: "Consistent naming convention",
        passed: consistencyRatio > 0.9,
        details: total > 0 
          ? `${Math.round(consistencyRatio * 100)}% consistent (${dominant[0]} convention)`
          : "No properties to check"
      });
      
      results.score += consistencyRatio > 0.9 ? 1 : 0;
      results.maxScore += 1;
    } catch {
      results.validations.push({
        name: "Consistent naming convention",
        passed: false,
        details: "Unable to check naming convention"
      });
      results.maxScore += 1;
    }
    
    // Check 3: Array items have consistent schema
    try {
      const checkArrayConsistency = (arr) => {
        if (!Array.isArray(arr) || arr.length <= 1) return true;
        
        const firstType = typeof arr[0];
        const allSameType = arr.every(item => typeof item === firstType);
        
        if (!allSameType) return false;
        
        // For arrays of objects, check if they have the same keys
        if (firstType === "object" && arr[0] !== null) {
          const firstKeys = Object.keys(arr[0]).sort().join(',');
          return arr.every(obj => 
            obj !== null && Object.keys(obj).sort().join(',') === firstKeys
          );
        }
        
        return true;
      };
      
      const findArrays = (obj, path = '') => {
        let results = [];
        
        if (Array.isArray(obj)) {
          results.push({ path: path || 'root', array: obj });
          
          obj.forEach((item, index) => {
            if (item !== null && typeof item === 'object') {
              results = results.concat(findArrays(item, `${path}[${index}]`));
            }
          });
        } else if (obj !== null && typeof obj === 'object') {
          Object.keys(obj).forEach(key => {
            const value = obj[key];
            const newPath = path ? `${path}.${key}` : key;
            
            if (Array.isArray(value)) {
              results.push({ path: newPath, array: value });
            }
            
            if (value !== null && typeof value === 'object') {
              results = results.concat(findArrays(value, newPath));
            }
          });
        }
        
        return results;
      };
      
      const arrays = findArrays(json);
      const inconsistentArrays = arrays.filter(({ array }) => !checkArrayConsistency(array));
      
      results.validations.push({
        name: "Array items consistency",
        passed: inconsistentArrays.length === 0,
        details: inconsistentArrays.length === 0 
          ? "All arrays have consistent item types and structures" 
          : `Found ${inconsistentArrays.length} arrays with inconsistent items`
      });
      
      results.score += inconsistentArrays.length === 0 ? 1 : 0;
      results.maxScore += 1;
    } catch {
      results.validations.push({
        name: "Array items consistency",
        passed: false,
        details: "Unable to check array consistency"
      });
      results.maxScore += 1;
    }

    setValidationResults(results);
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

  const handleClear = () => {
    setJsonInput("");
    setFormattedJson("");
    setError("");
    setJsonStats(null);
    setValidationResults(null);
  };

  const handleLoadSample = () => {
    const sampleJson = JSON.stringify({
      name: "John Doe",
      age: 30,
      isEmployed: true,
      address: {
        street: "123 Main St",
        city: "Anytown",
        state: "CA",
        zip: "12345"
      },
      phoneNumbers: ["123-456-7890", "987-654-3210"],
      preferences: {
        theme: "dark",
        notifications: true,
        timezone: "UTC-8"
      },
      education: [
        {
          degree: "Bachelor's",
          field: "Computer Science",
          year: 2018
        },
        {
          degree: "Master's",
          field: "Data Science",
          year: 2020
        }
      ]
    }, null, 2);
    setJsonInput(sampleJson);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Store in history
    const newUpload = {
      name: file.name,
      size: file.size,
      timestamp: Date.now()
    };
    
    const updatedUploads = [newUpload, ...recentUploads.slice(0, 4)];
    setRecentUploads(updatedUploads);
    localStorage.setItem("jsonFormatterRecentUploads", JSON.stringify(updatedUploads));
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        setJsonInput(event.target.result);
      } catch {
        setError("Failed to load file");
      }
    };
    reader.readAsText(file);
  };

  const fixJson = () => {
    if (!jsonInput) return;

    try {
      // A more robust way to fix JSON
      const fixed = jsonInput
        // Add quotes to unquoted keys.
        .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
        // Replace single quotes with double quotes, but not in the middle of a word.
        .replace(/(?<![a-zA-Z])'|'(?![a-zA-Z])/g, '"')
         // remove trailing commas
        .replace(/,(\s*[}\]])/g, '$1');

      // Test if it's valid JSON now
      JSON.parse(fixed);
      setJsonInput(fixed);
      showPopup("JSON fixed successfully!");
    } catch (error) {
      // If still invalid, show error
      setError(`Couldn't fix JSON automatically: ${error.message}`);
    }
  };

  const copyAsCode = (language) => {
    let output = "";
    
    try {
      const parsed = JSON.parse(formattedJson);
      
      if (language === "javascript") {
        output = `const data = ${formattedJson};`;
      } else if (language === "python") {
        // A more robust way to convert to Python dictionary
        const toPython = (obj) => {
          if (obj === null) return "None";
          if (typeof obj === 'string') return `'${obj.replace(/'/g, "'")}'`;
          if (typeof obj === 'boolean') return obj ? "True" : "False";
          if (typeof obj === 'number') return obj.toString();
          if (Array.isArray(obj)) {
            return `[${obj.map(toPython).join(', ')}]`;
          }
          if (typeof obj === 'object') {
            const pairs = Object.keys(obj).map(key => {
              const formattedKey = `'${key.replace(/'/g, "'")}'`;
              return `${formattedKey}: ${toPython(obj[key])}`;
            });
            return `{${pairs.join(', ')}}`;
          }
          return '""';
        };
        output = `data = ${toPython(parsed)}`;
      } else if (language === "php") {
        output = `<?php\n$data = ${formattedJson};\n?>`;
      }
      
      navigator.clipboard.writeText(output);
      showPopup(`Copied as ${language} code!`);
    } catch (error) {
      setError(`Failed to convert to ${language}: ${error.message}`);
    }
  };

  return (
    <div className="pb-20">
      <SEO 
        seoData={{
          title: 'JSON Formatter & Validator | Format, Beautify, Analyze JSON Online - MyConverterTool',
          description: 'Free online JSON formatter, validator, and analyzer. Format, beautify, minify, and validate your JSON with our powerful, user-friendly tool. No sign-up required.',
          keywords: 'JSON formatter, JSON beautifier, JSON validator, JSON analyzer, pretty print JSON, JSON error checker, minify JSON, format JSON online',
          canonicalUrl: '/tools/json-formatter',
          ogType: 'website',
        }}
      />

      {/* Header */}
      <section className="text-center py-12 md:py-16" data-aos="fade-down">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 mb-6">
          <span className="material-icons text-xs">settings_ethernet</span>
          Developer Essential
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 leading-tight text-slate-900 dark:text-white">
          JSON <span className="text-indigo-600">Architect</span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed font-medium">
          The most powerful way to format, validate, and analyze your JSON data with industrial precision.
        </p>
      </section>

      <div className="max-w-6xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-1 overflow-hidden"
        >
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-10">
            {/* Tabs */}
            <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-10 max-w-md mx-auto">
              {["format", "analyze", "settings"].map((tab) => (
                <button
                  key={tab}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    activeTab === tab
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Input Workspace */}
            <div className="space-y-6">
              <div className="flex justify-between items-end px-2">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-1">Source JSON</h3>
                  <p className="text-xs text-slate-500 font-medium">Paste your code or upload a file</p>
                </div>
                <div className="flex gap-4">
                  <input type="file" accept=".json" onChange={handleFileUpload} id="json-up" className="hidden" />
                  <label htmlFor="json-up" className="text-xs font-bold text-indigo-600 cursor-pointer hover:underline">Upload File</label>
                  <button onClick={handleLoadSample} className="text-xs font-bold text-slate-500 hover:text-indigo-600">Sample</button>
                  <button onClick={handleClear} className="text-xs font-bold text-red-500 hover:underline">Clear</button>
                </div>
              </div>

              <div className="relative group">
                <textarea
                  className="w-full h-80 p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500/50 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white font-mono text-sm leading-relaxed outline-none resize-none shadow-inner"
                  placeholder='{ "key": "value" }'
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                />
                <div className="absolute bottom-6 right-8 flex gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Chars: {jsonInput.length}</span>
                  <span>Lines: {jsonInput.split('\n').length}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <button
                  onClick={handleFormatJson}
                  className="btn-primary w-full sm:w-auto px-10 py-4 !bg-indigo-600 shadow-indigo-500/25"
                >
                  <span className="material-icons text-sm">auto_fix_high</span>
                  Format Code
                </button>
                <button
                  onClick={handleMinifyJson}
                  className="px-8 py-4 rounded-2xl font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-all w-full sm:w-auto"
                >
                  Minify Output
                </button>
                <button
                  onClick={fixJson}
                  className="px-8 py-4 rounded-2xl font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all w-full sm:w-auto"
                >
                  Smart Fix
                </button>
                <div className="ml-auto flex gap-2">
                  <button onClick={() => setIndentSize(2)} className={`w-8 h-8 rounded-lg text-[10px] font-black ${indentSize === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>2</button>
                  <button onClick={() => setIndentSize(4)} className={`w-8 h-8 rounded-lg text-[10px] font-black ${indentSize === 4 ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>4</button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-start gap-4"
              >
                <FaTimes className="mt-1" />
                <div>
                  <p className="font-black text-xs uppercase tracking-widest mb-1">Parser Error</p>
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Dynamic Content Based on Tab */}
            <AnimatePresence mode="wait">
              {formattedJson && activeTab === "format" && (
                <motion.div
                  key="output" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-12 pt-12 border-t border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">Formatted Result</h3>
                    <div className="flex gap-3">
                      <button onClick={handleCopy} className="p-3 rounded-xl glass hover:text-indigo-600 transition-all">
                        <FaCopy size={18} />
                      </button>
                      <button onClick={handleDownload} className="p-3 rounded-xl glass hover:text-indigo-600 transition-all">
                        <FaDownload size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[2rem] overflow-hidden shadow-2xl">
                    <SyntaxHighlighter 
                      language="json" 
                      style={isDarkMode ? oneDark : docco} 
                      customStyle={{ padding: '2rem', margin: 0, fontSize: '13px', lineHeight: '1.6' }}
                    >
                      {formattedJson}
                    </SyntaxHighlighter>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-4 items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Copy As Code</span>
                    <button onClick={() => copyAsCode("javascript")} className="px-4 py-2 rounded-lg glass text-xs font-bold hover:text-indigo-600 transition-all">JavaScript</button>
                    <button onClick={() => copyAsCode("python")} className="px-4 py-2 rounded-lg glass text-xs font-bold hover:text-indigo-600 transition-all">Python</button>
                    <button onClick={() => copyAsCode("php")} className="px-4 py-2 rounded-lg glass text-xs font-bold hover:text-indigo-600 transition-all">PHP</button>
                  </div>
                </motion.div>
              )}

              {activeTab === "analyze" && (
                <motion.div
                  key="analyze" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-12 space-y-12"
                >
                  <section>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 px-2">Type Distribution</h3>
                    {jsonStats ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label="Objects" value={jsonStats.typeCounts.objects} color="indigo" />
                        <StatCard label="Arrays" value={jsonStats.typeCounts.arrays} color="blue" />
                        <StatCard label="Strings" value={jsonStats.typeCounts.strings} color="emerald" />
                        <StatCard label="Numbers" value={jsonStats.typeCounts.numbers} color="amber" />
                      </div>
                    ) : (
                      <p className="text-center py-10 glass rounded-3xl text-slate-400 font-bold">No data to analyze. Format some JSON first.</p>
                    )}
                  </section>

                  <section>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 px-2">Validation Integrity</h3>
                    {validationResults ? (
                      <div className="space-y-4">
                        {validationResults.validations.map((v, i) => (
                          <div key={i} className="flex items-center justify-between p-6 rounded-3xl glass border-none">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${v.passed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                {v.passed ? <FaCheck /> : <FaTimes />}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">{v.name}</p>
                                <p className="text-xs text-slate-500 font-medium">{v.details}</p>
                              </div>
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${v.passed ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                              {v.passed ? 'Passed' : 'Failed'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-10 glass rounded-3xl text-slate-400 font-bold">Validation results will appear here.</p>
                    )}
                  </section>
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

    const StatCard = ({ label, value, color }) => (
    <div className="p-6 rounded-[2rem] glass border-none text-center">
    <p className={`text-2xl font-black mb-1 text-${color}-600`}>{value}</p>
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
    </div>
    );

    export default JsonFormatter;