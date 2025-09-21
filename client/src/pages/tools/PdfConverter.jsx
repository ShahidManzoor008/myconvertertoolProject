import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { FileText, Upload, X } from 'lucide-react';
import AuthPopup from '../../components/AuthPopup';
import SEO from '../../utils/SEO';
import PdfViewer from '../../components/PdfViewer';
import PdfOperations from '../../components/PdfOperations';
import BatchQueue from '../../components/BatchQueue';
import FileHistory from '../../components/FileHistory';
import API_BASE_URL from "../../config/api.config";

const PdfConverter = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [convertedFiles, setConvertedFiles] = useState([]); // For storing converted files
  const [currentOperation, setCurrentOperation] = useState("convert"); // Default operation
  const [recentFiles, setRecentFiles] = useState([]);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [downloadData, setDownloadData] = useState(null);
  // Auth hook not needed here directly; AuthPopup/GoogleSignIn will handle login

  // Handle file download
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = downloadData.url;
    link.download = downloadData.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowAuthPopup(false);
    setDownloadData(null);
  };

  // Show a popup message for 2.5 seconds
  const showPopup = (message) => {
    setPopupMessage(message);
    setTimeout(() => setPopupMessage(""), 2500);
  };

  // Load recent files from localStorage
  useEffect(() => {
    const loadedRecent = JSON.parse(localStorage.getItem('recentFiles') || '[]');
    setRecentFiles(loadedRecent);
  }, []);

  // Add file to recent conversions
  const addToRecent = (file) => {
    const newFile = {
      ...file,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };

    setRecentFiles(prev => {
      const updated = [newFile, ...prev.slice(0, 9)]; // Keep only last 10 files
      localStorage.setItem('recentFiles', JSON.stringify(updated));
      return updated;
    });
  };

  // Configure dropzone for file uploads
  const { getRootProps, getInputProps } = useDropzone({
    multiple: true,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.ms-excel": [".xlsx"],
      "text/markdown": [".md", ".MD"],
      "application/vnd.ms-powerpoint": [".ppt", ".pptx"],
      "image/jpeg": [".jpg", ".jpeg", ".JPEG"],
      "image/png": [".png"],
    },
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        showPopup(`Invalid file types: ${rejectedFiles.map((f) => f.name).join(", ")}`);
      }

      // Filter valid files
      const filteredFiles = acceptedFiles.filter((file) => {
        const ext = file.name.split(".").pop().toLowerCase();
        return ["pdf", "docx", "xlsx","xls", "md", "ppt", "pptx", "jpg", "jpeg", "png"].includes(ext);
      });

      if (filteredFiles.length === 0) {
        showPopup("No valid files selected!");
        return;
      }

      setUploadedFiles(filteredFiles);
      showPopup(`${filteredFiles.length} valid file(s) selected`);
    },
  });

  // Clear selected files
  const handleClearSelection = () => {
    setUploadedFiles([]);
    setConvertedFiles([]); // Clear converted files
    showPopup("Selection cleared");
  };

  // Check if all files are images
  const areAllImages = (files) => {
    return files.every((file) => {
      const ext = file.name.split(".").pop().toLowerCase();
      return ["jpg", "jpeg", "png"].includes(ext);
    });
  };

  // Handle PDF operations
  const handlePdfOperation = async () => {
    if (uploadedFiles.length === 0) {
      showPopup("No files selected");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    uploadedFiles.forEach((file) => formData.append("files", file));

    try {
      let response;
      let endpoint = "";

      switch (currentOperation) {
        case "merge":
          endpoint = "/api/pdf/merge";
          break;
        case "split":
          endpoint = "/api/pdf/split";
          break;
        case "rotate":
          endpoint = "/api/pdf/rotate";
          break;
        case "watermark":
          endpoint = "/api/pdf/watermark";
          break;
        case "protect":
          endpoint = "/api/pdf/protect";
          break;
        case "compress":
          endpoint = "/api/pdf/compress";
          break;
        default:
          if (areAllImages(uploadedFiles)) {
            endpoint = "/api/batch-convert";
          } else {
            endpoint = "/api/files/upload";
          }
      }

      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        body: formData,
      });

      if (response.status === 401) {
        // Show login popup so user can sign in and retry
        setShowAuthPopup(true);
        throw new Error('Unauthorized: please sign in to continue');
      }

      if (!response.ok) {
        throw new Error(`${currentOperation} operation failed`);
      }

      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.includes("application/json")) {
        const results = await response.json();
        setConvertedFiles(
          results.map((result) => ({
            filename: result.filename,
            url: `data:application/pdf;base64,${result.base64}`,
          }))
        );
      } else {
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        setConvertedFiles([
          {
            filename: uploadedFiles.length > 1 ? "processed_files.zip" : "processed_document.pdf",
            url: downloadUrl,
          },
        ]);
      }

      showPopup(`${currentOperation} operation completed successfully!`);
    } catch (err) {
      showPopup(`${currentOperation} operation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      <SEO
        seoData={{
          title: 'Free PDF Converter | Convert Word, Excel, Images to PDF Online - MyConverterTool',
          description: 'Use our free PDF converter to convert Word to PDF, Excel to PDF, images to PDF, and more. Merge, split, compress PDFs online instantly.',
          keywords: 'pdf converter, word to pdf, excel to pdf, image to pdf, merge pdf, split pdf, compress pdf, online pdf tools',
          canonicalUrl: '/tools/pdf-converter',
          ogType: 'website',
          ogTitle: 'Free PDF Converter | Convert Word, Excel, Images to PDF Online',
          ogDescription: 'Convert documents and images to PDF format instantly. Free online PDF converter with advanced features.',
          ogImage: '/assets/MyConverterTool.png',
          structuredData: {
            '@type': 'WebApplication',
            name: 'PDF Converter',
            description: 'Free online PDF converter tool with support for multiple file formats',
            applicationCategory: 'DocumentManagement',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD'
            }
          }
        }}
      />

      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="text-3xl font-bold text-blue-600 mb-4 text-center"
      >
        Complete PDF Converter Tool
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="text-center text-gray-500 mb-6"
      >
        Convert DOCX, XLSX, Images, Markdown to PDF, merge or preview files.
      </motion.p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Upload and Convert */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          {/* File Dropzone */}
          <motion.div
            {...getRootProps()}
            whileHover={{ scale: 1.02 }}
            className="border-2 border-dashed border-blue-300 dark:border-blue-500 p-8 text-center cursor-pointer rounded-lg mb-6 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Supports DOCX, XLSX, Images, Markdown, and more
            </p>
          </motion.div>

          {/* PDF Operations */}
          <div className="mb-6">
            <PdfOperations
              onOperation={setCurrentOperation}
              loading={loading}
            />
          </div>

          {/* Batch Processing Queue */}
          <BatchQueue
            files={uploadedFiles}
            onRemoveFile={(file) => {
              setUploadedFiles(files => files.filter(f => f.name !== file.name));
            }}
            onStartProcessing={async (file) => {
              const formData = new FormData();
              formData.append("file", file);

              // Determine endpoint using same logic as handlePdfOperation
              let endpoint = "";

              if (areAllImages([file])) {
                endpoint = "/api/batch-convert";
              } else {
                switch (currentOperation) {
                  case "merge":
                    endpoint = "/api/pdf/merge";
                    break;
                  case "split":
                    endpoint = "/api/pdf/split";
                    break;
                  case "rotate":
                    endpoint = "/api/pdf/rotate";
                    break;
                  case "watermark":
                    endpoint = "/api/pdf/watermark";
                    break;
                  case "protect":
                    endpoint = "/api/pdf/protect";
                    break;
                  case "compress":
                    endpoint = "/api/pdf/compress";
                    break;
                  default:
                    // Default conversion (no auth required on server) -> files upload endpoint
                    endpoint = "/api/files/upload";
                }
              }

              const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: "POST",
                body: formData,
              });

              if (response.status === 401) {
                setShowAuthPopup(true);
                throw new Error('Unauthorized: please sign in to continue');
              }

              if (!response.ok) {
                const text = await response.text().catch(() => response.statusText);
                throw new Error(`Failed to process ${file.name}: ${response.status} ${text}`);
              }

              const contentType = response.headers.get("Content-Type");
              let result;

              if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                result = {
                  filename: data.filename,
                  url: `data:application/pdf;base64,${data.base64}`,
                };
              } else {
                const blob = await response.blob();
                result = {
                  filename: file.name.replace(/\.[^/.]+$/, "") + ".pdf",
                  url: URL.createObjectURL(blob),
                };
              }

              const resultWithDetails = { ...result, originalName: file.name };
              setConvertedFiles(prev => [...prev, resultWithDetails]);
              addToRecent(resultWithDetails);
              return resultWithDetails;
            }}
            onPauseProcessing={() => {
              showPopup("Processing paused");
            }}
            onDownload={() => {
              if (convertedFiles.length === 1) {
                const link = document.createElement('a');
                link.href = convertedFiles[0].url;
                link.download = convertedFiles[0].filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              } else if (convertedFiles.length > 1) {
                // Download ZIP of all files
                fetch(`${API_BASE_URL}/api/download-batch`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}),
                  },
                  body: JSON.stringify({ files: convertedFiles }),
                })
                  .then(response => response.blob())
                  .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = "processed_files.zip";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  })
                  .catch(error => {
                    showPopup("Failed to download files: " + error.message);
                  });
              }
            }}
          />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePdfOperation}
              disabled={loading || uploadedFiles.length === 0}
              className="flex items-center gap-2 py-2.5 px-4 rounded-lg text-white font-medium bg-blue-500 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-5 h-5" />
              Process Files
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClearSelection}
              className="flex items-center gap-2 py-2.5 px-4 rounded-lg text-white font-medium bg-red-500 hover:bg-red-600 transition-colors"
            >
              <X className="w-5 h-5" />
              Clear All
            </motion.button>
          </div>

          {/* File History */}
          <div className="mt-6">
            <FileHistory
              files={recentFiles}
              onDownload={(file) => {
                const link = document.createElement('a');
                link.href = file.url;
                link.download = file.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            />
          </div>
        </div>

        {/* Right Column - PDF Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden min-h-[600px]">
          {convertedFiles.length > 0 ? (
            <PdfViewer
              file={convertedFiles[0].url}
              filename={convertedFiles[0].filename}
            />
          ) : uploadedFiles.length > 0 ? ( // Check if there are uploaded files
            <PdfViewer
              file={URL.createObjectURL(uploadedFiles[0])} // Create a URL for the uploaded file
              filename={uploadedFiles[0].name}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <FileText className="w-16 h-16 mb-4" />
              <p>Upload a PDF to preview it here</p> {/* Updated message */}
            </div>
          )}
        </div>
      </div>

      {/* Popup Message */}
      {popupMessage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg"
        >
          {popupMessage}
        </motion.div>
      )}

      {/* Auth Popup */}
      <AuthPopup
        isOpen={showAuthPopup}
        onClose={() => setShowAuthPopup(false)}
        onLogin={async () => {
          try {
            // login will be triggered by GoogleSignIn; here we only run the post-login action
            // Give a short delay so AuthProvider has time to store token
            setShowAuthPopup(false);
            setTimeout(() => handleDownload(), 500);
          } catch {
            showPopup("Login failed. Please try again.");
          }
        }}
        onSkip={() => {
          handleDownload();
        }}
      />
    </motion.div>
  );
};

export default PdfConverter;