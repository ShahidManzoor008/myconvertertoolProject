import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import Popup from "../../components/Popup";
import SEO from '../../utils/SEO';
import { 
  Download, 
  Link, 
  MessageSquare, 
  Mail, 
  Phone, 
  Map, 
  Wifi, 
  Calendar, 
  Smartphone, 
  Image, 
  Copy, 
  Settings, 
  X
} from "lucide-react";

const QrCodeTool = () => {
  // Main content state
  const [content, setContent] = useState("");
  const [contentType, setContentType] = useState("text");
  const [title, setTitle] = useState("");
  
  // QR code appearance settings
  const [qrSize, setQrSize] = useState(200);
  const [qrColor, setQrColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [includeMargin, setIncludeMargin] = useState(true);
  const [errorCorrection, setErrorCorrection] = useState("M");
  const [logo, setLogo] = useState(null);
  const [logoSize, setLogoSize] = useState(20);
  
  // UI state
  const [popupMessage, setPopupMessage] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [tabHistory, setTabHistory] = useState([]);
  
  // Refs
  const qrRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Form fields for different content types
  const [formFields, setFormFields] = useState({
    text: "",
    url: "",
    email: { address: "", subject: "", body: "" },
    sms: { phone: "", message: "" },
    phone: { number: "" },
    location: { latitude: "", longitude: "" },
    wifi: { ssid: "", password: "", encryption: "WPA" },
    event: { title: "", start: "", end: "", location: "", description: "" },
    contact: { name: "", phone: "", email: "", address: "", website: "" }
  });

  // Validate content when it changes
  // Validate content when it changes
  useEffect(() => {
    if (content) {
      // setIsValid(true);
    } else {
      // setIsValid(false);
    }
  }, [content]);

  // Function to build content based on type and form fields
  useEffect(() => {
    let newContent = "";
    
    switch (contentType) {
      case "text":
        newContent = formFields.text;
        setTitle(formFields.text.substring(0, 20) + (formFields.text.length > 20 ? "..." : ""));
        break;
      case "url":
        newContent = formFields.url;
        setTitle("URL");
        break;
      case "email":
        if (formFields.email.address) {
          newContent = `mailto:${formFields.email.address}`;
          if (formFields.email.subject) newContent += `?subject=${encodeURIComponent(formFields.email.subject)}`;
          if (formFields.email.body) newContent += `${formFields.email.subject ? "&" : "?"}body=${encodeURIComponent(formFields.email.body)}`;
        }
        setTitle("Email");
        break;
      case "sms":
        if (formFields.sms.phone) {
          newContent = `sms:${formFields.sms.phone}`;
          if (formFields.sms.message) newContent += `?body=${encodeURIComponent(formFields.sms.message)}`;
        }
        setTitle("SMS");
        break;
      case "phone":
        if (formFields.phone.number) {
          newContent = `tel:${formFields.phone.number}`;
        }
        setTitle("Phone");
        break;
      case "location":
        if (formFields.location.latitude && formFields.location.longitude) {
          newContent = `geo:${formFields.location.latitude},${formFields.location.longitude}`;
        }
        setTitle("Location");
        break;
      case "wifi":
        if (formFields.wifi.ssid) {
          newContent = `WIFI:S:${formFields.wifi.ssid};`;
          if (formFields.wifi.password) newContent += `P:${formFields.wifi.password};`;
          newContent += `T:${formFields.wifi.encryption};`;
        }
        setTitle("WiFi");
        break;
      case "event":
        if (formFields.event.title && formFields.event.start) {
          newContent = `BEGIN:VEVENT\nSUMMARY:${formFields.event.title}\nDTSTART:${formFields.event.start.replace(/[-:]/g, "")}\n`;
          if (formFields.event.end) newContent += `DTEND:${formFields.event.end.replace(/[-:]/g, "")}\n`;
          if (formFields.event.location) newContent += `LOCATION:${formFields.event.location}\n`;
          if (formFields.event.description) newContent += `DESCRIPTION:${formFields.event.description}\n`;
          newContent += "END:VEVENT";
        }
        setTitle("Event");
        break;
      case "contact":
        if (formFields.contact.name) {
          newContent = "BEGIN:VCARD\nVERSION:3.0\n";
          newContent += `FN:${formFields.contact.name}\n`;
          if (formFields.contact.phone) newContent += `TEL:${formFields.contact.phone}\n`;
          if (formFields.contact.email) newContent += `EMAIL:${formFields.contact.email}\n`;
          if (formFields.contact.address) newContent += `ADR:;;${formFields.contact.address};;;;\n`;
          if (formFields.contact.website) newContent += `URL:${formFields.contact.website}\n`;
          newContent += "END:VCARD";
        }
        setTitle("Contact");
        break;
      default:
        newContent = "";
    }
    
    setContent(newContent);
  }, [contentType, formFields]);

  const showPopup = (message) => {
    setPopupMessage(message);
    setTimeout(() => setPopupMessage(""), 2000);
  };

  // Handle content type change with history tracking
  const handleContentTypeChange = (type) => {
    setTabHistory([...tabHistory, contentType]);
    setContentType(type);
  };

  

  const handleFormChange = (type, field, value) => {
    setFormFields(prev => {
      if (typeof prev[type] === 'object') {
        return {
          ...prev,
          [type]: {
            ...prev[type],
            [field]: value
          }
        };
      } else {
        return {
          ...prev,
          [type]: value
        };
      }
    });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogo(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownload = () => {
    const canvas = document.querySelector("canvas");
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `qrcode-${title || "code"}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showPopup("QR Code downloaded!");
    }
  };

  const handleCopy = () => {
    const canvas = document.querySelector("canvas");
    if (canvas) {
      canvas.toBlob(blob => {
        const item = new ClipboardItem({ "image/png": blob });
        navigator.clipboard.write([item]);
        showPopup("QR Code copied to clipboard!");
      });
    }
  };

  const handlePreview = () => {
    const canvas = document.querySelector("canvas");
    if (canvas) {
      setPreviewUrl(canvas.toDataURL("image/png"));
      setIsPreview(true);
    }
  };

  const closePreview = () => {
    setIsPreview(false);
  };

  // Content type configuration
  const contentTypes = [
    { id: "text", name: "Text", icon: <MessageSquare size={16} /> },
    { id: "url", name: "URL", icon: <Link size={16} /> },
    { id: "email", name: "Email", icon: <Mail size={16} /> },
    { id: "phone", name: "Phone", icon: <Phone size={16} /> },
    { id: "sms", name: "SMS", icon: <Smartphone size={16} /> },
    { id: "location", name: "Location", icon: <Map size={16} /> },
    { id: "wifi", name: "Wi-Fi", icon: <Wifi size={16} /> },
    { id: "event", name: "Event", icon: <Calendar size={16} /> },
    { id: "contact", name: "Contact", icon: <Smartphone size={16} /> }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 max-w-5xl mx-auto"
    >
      <SEO 
        seoData={{
          title: 'Free QR Code Generator - Create Custom QR Codes Online - MyConverterTool',
          description: 'Generate custom QR codes for free with our online QR Code Generator. Supports text, URLs, contact info, Wi-Fi credentials, and more!',
          keywords: 'free QR code generator, online QR code maker, create QR code, QR code for URLs, custom QR codes, no signup, WiFi QR code, vCard QR code, free productivity tools',
          canonicalUrl: '/tools/qr-code-generator',
          ogType: 'website',
          ogTitle: 'Free QR Code Generator - Create Custom QR Codes Online',
          ogDescription: 'Generate custom QR codes for free with our online QR Code Generator. Perfect for URLs, text, and business promotions!',
          ogImage: '/assets/MyConverterTool.png',
          structuredData: {
            '@type': 'WebApplication',
            name: 'QR Code Generator',
            description: 'Generate custom QR codes for free with our online QR Code Generator. Supports text, URLs, contact info, Wi-Fi credentials, and more!',
            applicationCategory: 'UtilityApplication',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD'
            },
            featureList: [
              'Text to QR Code',
              'URL to QR Code',
              'vCard QR Code',
              'WiFi QR Code',
              'Email QR Code',
              'SMS QR Code',
              'Custom QR Code Colors',
              'Logo Integration'
            ]
          }
        }}
      />

      <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 text-center">
        QR Code Generator
      </h1>
      <p className="text-center text-gray-600 dark:text-gray-300 mt-2">
        Create custom QR codes for various types of content
      </p>

      {/* Content Type Selector */}
      <div className="mt-6 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg shadow-sm overflow-x-auto">
        <div className="flex space-x-2">
          {contentTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => handleContentTypeChange(type.id)}
              className={`px-3 py-2 rounded-md whitespace-nowrap flex items-center ${
                contentType === type.id
                  ? "bg-blue-500 text-white"
                  : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
              } transition-colors text-sm`}
            >
              <span className="mr-1.5">{type.icon}</span>
              {type.name}
            </button>
          ))}
        </div>
      </div>

      {/* Input Fields Based on Content Type */}
      <div className="mt-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {contentType === "text" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Text Content
            </label>
            <textarea
              className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white resize-y min-h-20"
              placeholder="Enter any text..."
              value={formFields.text}
              onChange={(e) => handleFormChange("text", null, e.target.value)}
              rows={4}
            />
          </div>
        )}

        {contentType === "url" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL
            </label>
            <input
              type="url"
              className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white"
              placeholder="https://example.com"
              value={formFields.url}
              onChange={(e) => handleFormChange("url", null, e.target.value)}
            />
          </div>
        )}

        {contentType === "email" && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="email@example.com"
                value={formFields.email.address}
                onChange={(e) => handleFormChange("email", "address", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject (Optional)
              </label>
              <input
                type="text"
                className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="Email subject"
                value={formFields.email.subject}
                onChange={(e) => handleFormChange("email", "subject", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Body (Optional)
              </label>
              <textarea
                className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white resize-y"
                placeholder="Email body"
                value={formFields.email.body}
                onChange={(e) => handleFormChange("email", "body", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        {contentType === "phone" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white"
              placeholder="+1234567890"
              value={formFields.phone.number}
              onChange={(e) => handleFormChange("phone", "number", e.target.value)}
            />
          </div>
        )}

        {contentType === "sms" && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="+1234567890"
                value={formFields.sms.phone}
                onChange={(e) => handleFormChange("sms", "phone", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Message (Optional)
              </label>
              <textarea
                className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white resize-y"
                placeholder="Your message"
                value={formFields.sms.message}
                onChange={(e) => handleFormChange("sms", "message", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        {contentType === "location" && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Latitude
              </label>
              <input
                type="text"
                className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="e.g. 37.7749"
                value={formFields.location.latitude}
                onChange={(e) => handleFormChange("location", "latitude", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Longitude
              </label>
              <input
                type="text"
                className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="e.g. -122.4194"
                value={formFields.location.longitude}
                onChange={(e) => handleFormChange("location", "longitude", e.target.value)}
              />
            </div>
          </div>
        )}

        {contentType === "wifi" && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Network Name (SSID)
              </label>
              <input
                type="text"
                className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="WiFi network name"
                value={formFields.wifi.ssid}
                onChange={(e) => handleFormChange("wifi", "ssid", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                type="text"
                className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="WiFi password"
                value={formFields.wifi.password}
                onChange={(e) => handleFormChange("wifi", "password", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Encryption Type
              </label>
              <select
                className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white"
                value={formFields.wifi.encryption}
                onChange={(e) => handleFormChange("wifi", "encryption", e.target.value)}
              >
                <option value="WPA">WPA/WPA2/WPA3</option>
                <option value="WEP">WEP</option>
                <option value="nopass">No Password</option>
              </select>
            </div>
          </div>
        )}

        {contentType === "event" && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Event Title
              </label>
              <input
                type="text"
                className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="Event title"
                value={formFields.event.title}
                onChange={(e) => handleFormChange("event", "title", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white"
                  value={formFields.event.start}
                  onChange={(e) => handleFormChange("event", "start", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date & Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white"
                  value={formFields.event.end}
                  onChange={(e) => handleFormChange("event", "end", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location (Optional)
              </label>
              <input
                type="text"
                className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="Event location"
                value={formFields.event.location}
                onChange={(e) => handleFormChange("event", "location", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white resize-y"
                placeholder="Event description"
                value={formFields.event.description}
                onChange={(e) => handleFormChange("event", "description", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        {contentType === "contact" && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="John Doe"
                value={formFields.contact.name}
                onChange={(e) => handleFormChange("contact", "name", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="+1234567890"
                value={formFields.contact.phone}
                onChange={(e) => handleFormChange("contact", "phone", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email (Optional)
              </label>
              <input
                type="email"
                className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="email@example.com"
                value={formFields.contact.email}
                onChange={(e) => handleFormChange("contact", "email", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address (Optional)
              </label>
              <input
                type="text"
                className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="123 Main St, City, Country"
                value={formFields.contact.address}
                onChange={(e) => handleFormChange("contact", "address", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Website (Optional)
              </label>
              <input
                type="url"
                className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="https://example.com"
                value={formFields.contact.website}
                onChange={(e) => handleFormChange("contact", "website", e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* QR Code Appearance Settings */}
      <div className="mt-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium"
        >
          <Settings size={16} className="mr-1" />
          {showAdvanced ? "Hide" : "Show"} Advanced Options
        </button>
        
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  QR Code Size
                </label>
                <div className="flex items-center">
                  <input
                    type="range"
                    min="100"
                    max="400"
                    step="10"
                    value={qrSize}
                    onChange={(e) => setQrSize(Number(e.target.value))}
                    className="w-full cursor-pointer"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300 w-16 text-center">{qrSize}px</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Error Correction
                </label>
                <select
                  value={errorCorrection}
                  onChange={(e) => setErrorCorrection(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white"
                >
                  <option value="L">Low (7%)</option>
                  <option value="M">Medium (15%)</option>
                  <option value="Q">Quartile (25%)</option>
                  <option value="H">High (30%)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  QR Color
                </label>
                <div className="flex items-center">
                  <input
                    type="color"
                    value={qrColor}
                    onChange={(e) => setQrColor(e.target.value)}
                    className="p-0 w-10 h-10 border-0"
                  />
                  <input
                    type="text"
                    value={qrColor}
                    onChange={(e) => setQrColor(e.target.value)}
                    className="ml-2 p-2 w-32 border rounded-md dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Background Color
                </label>
                <div className="flex items-center">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="p-0 w-10 h-10 border-0"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="ml-2 p-2 w-32 border rounded-md dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Include Margin
                </label>
                <div className="flex items-center">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={includeMargin}
                      onChange={(e) => setIncludeMargin(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">
                      Add quiet zone around QR code
                    </span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Logo (Optional)
                </label>
                <div className="flex items-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id=                    "logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600 transition"
                    >
                      Upload Logo
                    </label>
                    {logo && (
                      <button
                        onClick={removeLogo}
                        className="ml-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                  {logo && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Logo Size
                      </label>
                      <div className="flex items-center">
                        <input
                          type="range"
                          min="10"
                          max="50"
                          step="5"
                          value={logoSize}
                          onChange={(e) => setLogoSize(Number(e.target.value))}
                          className="w-full cursor-pointer"
                        />
                        <span className="ml-2 text-gray-700 dark:text-gray-300 w-16 text-center">{logoSize}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
  
        {/* QR Code Preview */}
        <div className="mt-6 flex justify-center">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <QRCodeCanvas
              value={content}
              size={qrSize}
              fgColor={qrColor}
              bgColor={bgColor}
              includeMargin={includeMargin}
              level={errorCorrection}
              imageSettings={
                logo
                  ? {
                      src: logo,
                      excavate: true,
                      width: (qrSize * logoSize) / 100,
                      height: (qrSize * logoSize) / 100,
                    }
                  : undefined
              }
              ref={qrRef}
            />
          </div>
        </div>
  
        {/* Action Buttons */}
        <div className="mt-6 flex justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownload}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition flex items-center"
          >
            <Download size={16} className="mr-2" />
            Download
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition flex items-center"
          >
            <Copy size={16} className="mr-2" />
            Copy
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePreview}
            className="px-6 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition flex items-center"
          >
            <Image size={16} className="mr-2" />
            Preview
          </motion.button>
        </div>
  
        {/* Preview Modal */}
        <AnimatePresence>
          {isPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={closePreview}
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                    QR Code Preview
                  </h2>
                  <button
                    onClick={closePreview}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <X size={20} className="text-gray-800 dark:text-gray-200" />
                  </button>
                </div>
                <img src={previewUrl} alt="QR Code Preview" className="w-full max-w-sm mx-auto" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
  
        {/* Popup Notification */}
        {popupMessage && <Popup message={popupMessage} onClose={() => setPopupMessage("")} />}
      </motion.div>
    );
  };
  
  export default QrCodeTool;