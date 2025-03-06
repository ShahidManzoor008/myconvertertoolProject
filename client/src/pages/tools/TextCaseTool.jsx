import { useState } from "react";
import { motion } from "framer-motion";
import Popup from "../../components/Popup";

const TextCaseTool = () => {
  const [text, setText] = useState("");
  const [convertedText, setConvertedText] = useState("");
  const [popupMessage, setPopupMessage] = useState("");

  const showPopup = (message) => {
    setPopupMessage(message);
    setTimeout(() => setPopupMessage(""), 2000); // Auto-hide popup
  };

  const toUpperCase = () => setConvertedText(text.toUpperCase());
  const toLowerCase = () => setConvertedText(text.toLowerCase());
  const toCapitalize = () =>
    setConvertedText(text.replace(/\b\w/g, (char) => char.toUpperCase()));
  const toSentenceCase = () =>
    setConvertedText(text.charAt(0).toUpperCase() + text.slice(1).toLowerCase());

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
    showPopup("File downloaded!");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 text-center">Text Case Converter</h1>
      <p className="text-center text-gray-600 dark:text-gray-300 mt-2">Convert text to uppercase, lowercase, and more!</p>

      {/* Input Textarea */}
      <textarea className="w-full h-40 p-3 mt-6 border rounded-md dark:bg-gray-800 dark:text-white" placeholder="Enter text here..." value={text} onChange={(e) => setText(e.target.value)}></textarea>

      {/* Buttons for Conversions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toUpperCase} className="bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition">UPPERCASE</motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toLowerCase} className="bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition">lowercase</motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toCapitalize} className="bg-yellow-500 text-white py-2 rounded-md hover:bg-yellow-600 transition">Capitalize</motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toSentenceCase} className="bg-purple-500 text-white py-2 rounded-md hover:bg-purple-600 transition">Sentence case</motion.button>
      </div>

      {/* Output Result Box */}
      {convertedText && (
        <div className="mt-6 bg-gray-100 dark:bg-gray-800 p-4 rounded-md shadow-md relative">
          <h2 className="text-xl font-semibold">Converted Text:</h2>
          <pre className="mt-2 text-gray-800 dark:text-gray-200 overflow-auto">{convertedText}</pre>

          {/* Copy & Download Buttons */}
          <div className="flex gap-4 mt-4">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleCopy} className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition">Copy</motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleDownload} className="bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition">Download</motion.button>
          </div>
        </div>
      )}

      {/* Popup Notification */}
      {popupMessage && <Popup message={popupMessage} onClose={() => setPopupMessage("")} />}
    </motion.div>
  );
};

export default TextCaseTool;
