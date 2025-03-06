import { useState } from "react";
import { motion } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react"; 
import Popup from "../../components/Popup";
import { Helmet } from "react-helmet-async";

const QrCodeTool = () => {
  const [text, setText] = useState("");
  const [qrSize, setQrSize] = useState(200);
  const [popupMessage, setPopupMessage] = useState("");

  const showPopup = (message) => {
    setPopupMessage(message);
    setTimeout(() => setPopupMessage(""), 2000);
  };

  const handleDownload = () => {
    const canvas = document.querySelector("canvas");
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "qrcode.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showPopup("QR Code downloaded!");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 max-w-5xl mx-auto"
    >
      <Helmet>
  <title>Free QR Code Generator - Create Custom QR Codes Online</title>
  <meta name="description" content="Generate custom QR codes for free with our online QR Code Generator. Perfect for URLs, text, and business promotions!" />
  <meta name="keywords" content="free QR code generator, online QR code maker, create QR code, QR code for URLs, custom QR codes, no signup, free productivity tools" />
  <meta property="og:title" content="Free QR Code Generator - Create Custom QR Codes Online" />
  <meta property="og:description" content="Generate custom QR codes for free with our online QR Code Generator. Perfect for URLs, text, and business promotions!" />
  <meta property="og:url" content="https://myconvertertool.com/tools/qr-code-generator" />
  <meta property="og:type" content="website" />
</Helmet>

      <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 text-center">
        QR Code Generator
      </h1>
      <p className="text-center text-gray-600 dark:text-gray-300 mt-2">
        Enter text or a URL to generate a QR code.
      </p>

      {/* Input Field */}
      <input
        type="text"
        className="w-full p-3 mt-6 border rounded-md dark:bg-gray-800 dark:text-white"
        placeholder="Enter text or URL..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {/* QR Code Size Selector */}
      <div className="mt-4 flex justify-between">
        <label className="text-gray-700 dark:text-gray-300">Size:</label>
        <input
          type="range"
          min="100"
          max="400"
          step="50"
          value={qrSize}
          onChange={(e) => setQrSize(Number(e.target.value))}
          className="cursor-pointer"
        />
        <span className="text-gray-700 dark:text-gray-300">{qrSize}px</span>
      </div>

      {/* QR Code Display */}
      {text && (
        <div className="mt-6 flex justify-center">
          <QRCodeCanvas value={text} size={qrSize} /> {/* ✅ Use QRCodeCanvas */}
        </div>
      )}

      {/* Download Button */}
      {text && (
        <div className="flex justify-center mt-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownload}
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition"
          >
            Download QR Code
          </motion.button>
        </div>
      )}

      {/* Popup Notification */}
      {popupMessage && (
        <Popup message={popupMessage} onClose={() => setPopupMessage("")} />
      )}
    </motion.div>
  );
};

export default QrCodeTool;