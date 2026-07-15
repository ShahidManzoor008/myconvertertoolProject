import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import PropTypes from "prop-types";
import SEO from "../../utils/SEO";
import ToolSupportSection from "../../components/ToolSupportSection";
import { statsApi } from "../../utils/apiClient";
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
  const [includeMargin] = useState(true);
  const [errorCorrection] = useState("M");
  const [logo, setLogo] = useState(null);
  const [logoSize] = useState(20);
  
  // UI state
  const [popupMessage, setPopupMessage] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [tabHistory, setTabHistory] = useState([]);
  
  // Refs
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

      // Log conversion
      statsApi.increment({
        toolName: 'qrcode-generator',
        fileName: `qrcode-${title || "code"}.png`
      }).catch(err => console.error('Failed to log stats:', err));
    }
  };

  const handleCopy = () => {
    const canvas = document.querySelector("canvas");
    if (canvas) {
      canvas.toBlob(blob => {
        const item = new ClipboardItem({ "image/png": blob });
        navigator.clipboard.write([item]);
        showPopup("QR Code copied to clipboard!");

        // Log conversion
        statsApi.increment({
          toolName: 'qrcode-generator',
          status: 'copy'
        }).catch(err => console.error('Failed to log stats:', err));
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
    <div className="pb-20">
      <SEO 
        seoData={{
          title: 'Free QR Code Generator - Create Custom QR Codes Online - MyConverterTool',
          description: 'Generate custom QR codes for free with our online QR Code Generator. Supports text, URLs, contact info, Wi-Fi credentials, and more!',
          keywords: 'free QR code generator, online QR code maker, create QR code, QR code for URLs, custom QR codes, no signup, WiFi QR code, vCard QR code, free productivity tools',
          canonicalUrl: '/tools/qr-code-generator',
          ogType: 'website',
        }}
      />

      {/* Header */}
      <section className="text-center py-12 md:py-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[10px] font-black uppercase tracking-widest border border-teal-500/20 mb-6">
          <span className="material-icons text-xs">qr_code_2</span>
          Instant Connectivity
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 leading-tight text-slate-900 dark:text-white">
          QR <span className="text-teal-600">Studio</span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed font-medium">
          Create beautiful, custom QR codes for websites, WiFi, contacts, and more in seconds.
        </p>
      </section>

      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-8 space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-1 overflow-hidden"
          >
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-10">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8 px-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                Select Content Type
              </h2>

              {/* Type Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-10">
                {contentTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleContentTypeChange(type.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all border ${
                      contentType === type.id
                        ? "bg-teal-600 border-teal-500 text-white shadow-lg shadow-teal-500/25"
                        : "bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span className={contentType === type.id ? "text-white" : "text-teal-500"}>{type.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-tighter">{type.name}</span>
                  </button>
                ))}
              </div>

              {/* Dynamic Inputs */}
              <div className="space-y-6 animate-fade-in">
                {contentType === "text" && (
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Raw Text</label>
                    <textarea
                      className="w-full p-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-teal-500/50 outline-none transition-all font-medium text-slate-900 dark:text-white min-h-[150px]"
                      placeholder="What should this QR code contain?"
                      value={formFields.text}
                      onChange={(e) => handleFormChange("text", null, e.target.value)}
                    />
                  </div>
                )}

                {contentType === "url" && (
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Website URL</label>
                    <div className="relative">
                      <Link size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-teal-500" />
                      <input
                        type="url"
                        className="w-full pl-14 pr-6 py-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-teal-500/50 outline-none transition-all font-bold text-slate-900 dark:text-white"
                        placeholder="https://example.com"
                        value={formFields.url}
                        onChange={(e) => handleFormChange("url", null, e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Email, SMS, WiFi, etc (grouped for brevity but styled same) */}
                {(contentType === "email" || contentType === "sms" || contentType === "wifi" || contentType === "location" || contentType === "contact" || contentType === "event") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contentType === "wifi" && (
                      <>
                        <InputField label="Network Name (SSID)" value={formFields.wifi.ssid} onChange={(val) => handleFormChange("wifi", "ssid", val)} placeholder="Home-WiFi" />
                        <InputField label="Password" type="password" value={formFields.wifi.password} onChange={(val) => handleFormChange("wifi", "password", val)} placeholder="••••••••" />
                        <div className="md:col-span-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 mb-2 block">Encryption</label>
                          <select
                            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none font-bold"
                            value={formFields.wifi.encryption}
                            onChange={(e) => handleFormChange("wifi", "encryption", e.target.value)}
                          >
                            <option value="WPA">WPA/WPA2/WPA3</option>
                            <option value="WEP">WEP</option>
                            <option value="nopass">No Password</option>
                          </select>
                        </div>
                      </>
                    )}
                    {contentType === "email" && (
                      <>
                        <InputField label="Recipient Email" value={formFields.email.address} onChange={(val) => handleFormChange("email", "address", val)} placeholder="hello@example.com" />
                        <InputField label="Subject" value={formFields.email.subject} onChange={(val) => handleFormChange("email", "subject", val)} placeholder="Inquiry" />
                        <div className="md:col-span-2">
                           <InputField label="Body Content" value={formFields.email.body} onChange={(val) => handleFormChange("email", "body", val)} placeholder="Type your message..." />
                        </div>
                      </>
                    )}
                    {/* Add other types as needed with same pattern */}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Advanced Styling */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-1 overflow-hidden"
          >
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-10">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between text-left group"
              >
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Customize Appearance</h2>
                  <p className="text-sm text-slate-500 font-medium">Adjust colors, size, and add a brand logo</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-all ${showAdvanced ? 'rotate-180 bg-teal-500 text-white' : ''}`}>
                  <Settings size={20} />
                </div>
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-8 pt-8 border-t border-slate-100 dark:border-slate-800"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <ColorPicker label="QR Color" value={qrColor} onChange={setQrColor} />
                      <ColorPicker label="Background" value={bgColor} onChange={setBgColor} />
                      
                      <div className="space-y-4">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 block">QR Resolution: {qrSize}px</label>
                        <input
                          type="range" min="100" max="400" step="10"
                          value={qrSize} onChange={(e) => setQrSize(Number(e.target.value))}
                          className="w-full accent-teal-600"
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 block">Brand Logo</label>
                        <div className="flex gap-2">
                          <input
                            ref={fileInputRef} type="file" accept="image/*"
                            onChange={handleLogoUpload} className="hidden" id="logo-studio"
                          />
                          <label
                            htmlFor="logo-studio"
                            className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-center font-bold text-sm cursor-pointer hover:bg-teal-500 hover:text-white transition-all"
                          >
                            {logo ? 'Change Logo' : 'Upload Image'}
                          </label>
                          {logo && (
                            <button onClick={removeLogo} className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                              <X size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-4">
          <div className="sticky top-32 space-y-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-8 text-center"
            >
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8">Live Preview</h2>
              
              <div className="relative inline-block p-6 rounded-[2.5rem] bg-white shadow-2xl border-8 border-slate-50 mb-10 group">
                <div className="absolute inset-0 bg-teal-500/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <QRCodeCanvas
                    value={content || "https://myconvertertool.com"}
                    size={220}
                    fgColor={qrColor}
                    bgColor={bgColor}
                    includeMargin={includeMargin}
                    level={errorCorrection}
                    imageSettings={
                      logo
                        ? {
                            src: logo,
                            excavate: true,
                            width: (220 * logoSize) / 100,
                            height: (220 * logoSize) / 100,
                          }
                        : undefined
                    }
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleDownload}
                  className="btn-primary w-full !bg-teal-600 hover:!bg-teal-700 shadow-teal-500/25 py-4"
                >
                  <Download size={20} />
                  Download PNG
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleCopy} className="py-3 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                    <Copy size={16} /> Copy
                  </button>
                  <button onClick={handlePreview} className="py-3 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                    <Image size={16} /> Preview
                  </button>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Security Note</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your content is processed locally in your browser. No data is stored on our servers.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <ToolSupportSection currentPath="/tools/qr-code-generator" category="SEO Tools" />
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {isPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 z-[200]"
            onClick={closePreview}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-2xl max-w-md w-full text-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={closePreview} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <X size={24} />
              </button>
              <h2 className="text-2xl font-black mb-8 tracking-tighter">Your QR Code</h2>
              <img src={previewUrl} alt="QR Code" className="w-full rounded-3xl shadow-lg mb-8" />
              <button onClick={handleDownload} className="btn-primary w-full !bg-teal-600">
                Download Now
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popup Notification */}
      {popupMessage && (
        <div className="fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl bg-slate-900 text-white shadow-2xl flex items-center gap-3 animate-slide-up">
          <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          <span className="text-sm font-bold uppercase tracking-widest">{popupMessage}</span>
        </div>
      )}
    </div>
  );
};

const InputField = ({ label, value, onChange, placeholder, type = "text" }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{label}</label>
    <input
      type={type}
      className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none font-bold text-slate-900 dark:text-white transition-all focus:ring-2 focus:ring-teal-500/20"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

InputField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  type: PropTypes.string,
};

const ColorPicker = ({ label, value, onChange }) => (
  <div className="space-y-4">
    <label className="text-xs font-black uppercase tracking-widest text-slate-400 block">{label}</label>
    <div className="flex items-center gap-3">
      <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
        <input
          type="color" value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer"
        />
      </div>
      <input
        type="text" value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-mono text-sm font-bold uppercase"
      />
    </div>
  </div>
);

ColorPicker.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default QrCodeTool;
