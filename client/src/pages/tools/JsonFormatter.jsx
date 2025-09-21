import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SEO from '../../utils/SEO';
import Popup from "../../components/Popup";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`p-4 md:p-6 max-w-6xl mx-auto ${isDarkMode ? "dark" : ""}`}
    >
      <SEO 
        seoData={{
          title: 'JSON Formatter & Validator | Format, Beautify, Analyze JSON Online - MyConverterTool',
          description: 'Free online JSON formatter, validator, and analyzer. Format, beautify, minify, and validate your JSON with our powerful, user-friendly tool. No sign-up required.',
          keywords: 'JSON formatter, JSON beautifier, JSON validator, JSON analyzer, pretty print JSON, JSON error checker, minify JSON, format JSON online',
          canonicalUrl: '/tools/json-formatter',
          ogType: 'website',
          ogTitle: 'JSON Formatter & Validator | Format, Beautify, Analyze JSON Online',
          ogDescription: 'Free online JSON formatter, validator, and analyzer. Format, beautify, minify, and validate your JSON with our powerful, user-friendly tool. No sign-up required.',
          ogImage: '/assets/MyConverterTool.png',
          structuredData: {
            '@type': 'WebApplication',
            name: 'JSON Formatter & Validator',
            description: 'Free online JSON formatter, validator, and analyzer. Format, beautify, minify, and validate your JSON with our powerful, user-friendly tool.',
            applicationCategory: 'DeveloperApplication',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD'
            },
            operatingSystem: 'Web browser',
            browserRequirements: 'Requires JavaScript. Compatible with most modern web browsers.'
          }
        }}
      />

      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 text-center">
          JSON Formatter & Validator
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mt-2">
          Format, beautify, minify, and validate your JSON with our powerful tool
        </p>
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 md:p-6 mb-6 transition-colors duration-200">
        {/* Main Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
          <button
            className={`py-2 px-4 mr-2 ${
              activeTab === "format"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-medium"
                : "text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-300"
            }`}
            onClick={() => setActiveTab("format")}
          >
            Format & Validate
          </button>
          <button
            className={`py-2 px-4 mr-2 ${
              activeTab === "analyze"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-medium"
                : "text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-300"
            }`}
            onClick={() => setActiveTab("analyze")}
          >
            Analyze
          </button>
          <button
            className={`py-2 px-4 ${
              activeTab === "settings"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-medium"
                : "text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-300"
            }`}
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </button>
        </div>

        {/* Input Area */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="jsonInput" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Input JSON
            </label>
            <div className="flex items-center">
              <label className="relative inline-flex items-center cursor-pointer mr-4">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="sr-only"
                  id="jsonFileUpload"
                />
                <label
                  htmlFor="jsonFileUpload"
                  className="cursor-pointer text-sm bg-gray-100 dark:bg-gray-700 py-1 px-3 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Upload JSON
                </label>
              </label>
              <button 
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? "Hide History" : "Recent Files"}
              </button>
            </div>
          </div>
          
          {showHistory && recentUploads.length > 0 && (
            <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-900 rounded text-sm">
              <h3 className="font-medium mb-1 text-gray-700 dark:text-gray-300">Recent Files</h3>
              <ul className="space-y-1">
                {recentUploads.map((upload, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{upload.name} ({formatSize(upload.size)})</span>
                    <span className="text-gray-500 dark:text-gray-500 text-xs">
                      {new Date(upload.timestamp).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <textarea
            id="jsonInput"
            className="w-full h-40 sm:h-60 p-3 border rounded-md font-mono text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
            placeholder="Paste JSON here or upload a file..."
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
          ></textarea>

          {/* Input Stats & Tools */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-2 text-sm">
            <div className="text-gray-500 dark:text-gray-400 mb-2 sm:mb-0">
              Characters: {jsonInput.length} | 
              Lines: {jsonInput.split("\n").length}
            </div>
            
            <div className="space-x-3">
              <button 
                onClick={fixJson}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Fix JSON
              </button>
              <button 
                onClick={handleLoadSample}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Load Sample
              </button>
              <button 
                onClick={handleClear}
                className="text-red-600 dark:text-red-400 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {activeTab === "format" && (
          <div className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFormatJson}
                className="bg-blue-600 dark:bg-blue-700 text-white py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center justify-center"
              >
                <span className="mr-2">Format JSON</span>
                <span className="text-xs bg-blue-500 dark:bg-blue-500 px-2 py-0.5 rounded">Space: {indentSize}</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleMinifyJson}
                className="bg-green-600 dark:bg-green-700 text-white py-2 px-4 rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
              >
                Minify JSON
              </motion.button>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Formatting Options</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Indent Size
              </label>
              <div className="flex space-x-3">
                {[2, 4, 6, 8].map((size) => (
                  <button
                    key={size}
                    className={`px-3 py-1 rounded-md ${
                      indentSize === size
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                    onClick={() => setIndentSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Display Settings</h3>
            
            <div className="flex items-center mb-4">
              <button
                onClick={toggleDarkMode}
                className="flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {isDarkMode ? (
                  <>
                    <FaSun className="mr-2" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <FaMoon className="mr-2" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-md mb-4 flex items-start">
            <FaTimes className="flex-shrink-0 mt-1 mr-2" />
            <div>
              <p className="font-medium">JSON Error Detected</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Output and Analysis Sections */}
        {formattedJson && (
          <>
            {activeTab === "format" && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3 shadow-inner relative">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">Formatted Output</h2>
                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCopy}
                      className="flex items-center bg-blue-600 text-white py-1 px-3 rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      <FaCopy className="mr-1" /> Copy
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDownload}
                      className="flex items-center bg-gray-700 text-white py-1 px-3 rounded-md hover:bg-gray-800 transition-colors text-sm"
                    >
                      <FaDownload className="mr-1" /> Download
                    </motion.button>
                  </div>
                </div>
                
                <SyntaxHighlighter 
                  language="json" 
                  style={isDarkMode ? atomOneDark : docco} 
                  className="rounded-md text-sm overflow-auto"
                  showLineNumbers={true}
                  wrapLines={true}
                >
                  {formattedJson}
                </SyntaxHighlighter>
                
                {/* Export options */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400 self-center mr-1">Export as:</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => copyAsCode("javascript")}
                    className="flex items-center bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-1 px-3 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    JavaScript
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => copyAsCode("python")}
                    className="flex items-center bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-1 px-3 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    Python
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => copyAsCode("php")}
                    className="flex items-center bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-1 px-3 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    PHP
                  </motion.button>
                </div>
              </div>
            )}

            {activeTab === "analyze" && (
              <div className="space-y-4">
                {/* JSON Statistics */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">JSON Statistics</h3>
                  {jsonStats ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Formatted Size</p>
                        <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                          {jsonStats.readableSize}
                        </p>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Minified Size</p>
                        <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                          {jsonStats.readableMinifiedSize}
                        </p>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Compression Ratio</p>
                        <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                          {((jsonStats.minifiedSize / jsonStats.size) * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Objects</p>
                        <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                          {jsonStats.typeCounts.objects}
                        </p>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Arrays</p>
                        <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                          {jsonStats.typeCounts.arrays}
                        </p>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Strings</p>
                        <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                          {jsonStats.typeCounts.strings}
                        </p>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Numbers</p>
                        <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                          {jsonStats.typeCounts.numbers}
                        </p>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Booleans</p>
                        <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                          {jsonStats.typeCounts.booleans}
                        </p>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Nulls</p>
                        <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                          {jsonStats.typeCounts.nulls}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">No JSON data to analyze.</p>
                  )}
                </div>

                {/* JSON Validation Results */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Validation Results</h3>
                  {validationResults ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Validation Score</p>
                        <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                          {validationResults.score} / {validationResults.maxScore}
                        </p>
                      </div>
                      <div className="space-y-2">
                        {validationResults.validations.map((validation, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-md ${
                              validation.passed
                                ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                            }`}
                          >
                            <div className="flex items-center">
                              {validation.passed ? (
                                <FaCheck className="mr-2 flex-shrink-0" />
                              ) : (
                                <FaTimes className="mr-2 flex-shrink-0" />
                              )}
                              <div>
                                <p className="font-medium">{validation.name}</p>
                                <p className="text-sm">{validation.details}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">No validation results available.</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Popup Notification */}
      {popupMessage && <Popup message={popupMessage} onClose={() => setPopupMessage("")} />}
    </motion.div>
  );
};

export default JsonFormatter;