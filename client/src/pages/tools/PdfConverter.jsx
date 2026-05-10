import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, X, Eye } from 'lucide-react';
import AuthPopup from '../../components/AuthPopup';
import SEO from '../../utils/SEO';
import PdfOperations from '../../components/PdfOperations';
import FileHistory from '../../components/FileHistory';
import PdfViewer from '../../components/PdfViewer';
import ConversionProgressBar from '../../components/common/ConversionProgressBar'; // Import ConversionProgressBar
import { pdfApi } from '../../utils/apiClient';
import { createFormDataWithFiles } from '../../utils/fileUtils';
import { AppError } from '../../utils/AppError';
import { useAuth } from '../../hooks/useAuth'; // Import useAuth
import { useQuery } from '@tanstack/react-query';
import { statsApi } from '../../utils/apiClient';

const PdfConverter = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [convertedFiles, setConvertedFiles] = useState([]); // For storing converted files
  const [viewingFile, setViewingFile] = useState(null); // For storing the file to be viewed
  // selectedOperation controls the high-level card choice (null = show action cards)
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [currentOperation, setCurrentOperation] = useState("convert"); // Default sub-operation
  const [recentFiles, setRecentFiles] = useState([]);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [downloadData, setDownloadData] = useState(null);
  const { user } = useAuth(); // Get user from AuthProvider

  // Fetch total conversions from server
  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['totalConversions'],
    queryFn: async () => {
      const data = await statsApi.getTotal();
      return data.total;
    },
    initialData: 0
  });

  const totalConversions = statsData;

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
      const updated = [newFile, ...prev.slice(0, 4)]; // Keep only last 5 files
      
      // Remove the base64 content before storing in localStorage to prevent QuotaExceededError
      const storedUpdated = updated.map(f => {
        const fileData = f.filename ? f : (f[0] || {});
        const rest = { ...fileData };
        delete rest.base64;
        if (f.filename) {
          return rest;
        }
        return { ...f, 0: rest };
      });

      try {
        localStorage.setItem('recentFiles', JSON.stringify(storedUpdated));
      } catch (error) {
        if (error.name === 'QuotaExceededError') {
          console.error("Could not add to recent files, storage quota exceeded. Clearing recent files and trying again.");
          localStorage.removeItem('recentFiles');
          try {
            localStorage.setItem('recentFiles', JSON.stringify(storedUpdated));
          } catch (e) {
            console.error("Still unable to save recent files after clearing.", e);
          }
        }
      }
      
      return updated;
    });

    // Refetch stats from server
    refetchStats();
  };

  // Determine accepted file types based on the chosen high-level operation
  const getAcceptForOperation = (op) => {
    switch (op) {
      case 'convert':
        return {
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ['.docx'],
          "application/msword": ['.doc'],
          "application/vnd.ms-excel": ['.xlsx', '.xls'],
          "application/vnd.ms-powerpoint": ['.ppt', '.pptx'],
          "text/markdown": ['.md', '.MD'],
          "text/plain": ['.txt'],
          'image/jpeg': ['.jpg', '.jpeg'],
          'image/png': ['.png'],
        };
      case 'edit':
        // Operations that operate on existing PDFs only
        return {
          'application/pdf': ['.pdf'],
        };
      default:
        // Default to convert types if no operation is selected or an unknown one
        return getAcceptForOperation('convert');
    }
  };

  // Configure dropzone for file uploads (hidden until an operation is selected)
  const { getRootProps, getInputProps } = useDropzone({
    multiple: true,
    accept: getAcceptForOperation(selectedOperation || 'convert'),
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        showPopup(`Invalid file types: ${rejectedFiles.map((f) => f.name).join(", ")}`);
      }

      const allowedMimeTypes = getAcceptForOperation(selectedOperation || 'convert');
      const allowedExtensions = Object.values(allowedMimeTypes).flat().map(ext => ext.substring(1)); // Remove the dot

      // Filter valid files based on the allowed extensions for the current operation
      const filteredFiles = acceptedFiles.filter((file) => {
        const ext = file.name.split(".").pop().toLowerCase();
        return allowedExtensions.includes(ext);
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
    // setConvertedFiles([]); // Removed: Converted files should persist for download/preview
    showPopup("Selection cleared");
  };

  // Helper: determine file extension
  const getFileExt = (file) => (file?.name || '').split('.').pop().toLowerCase();

  // Determine if a single file can be processed for the selected operation
  const canProcessSingle = (file, operation) => {
    if (!file) return false;
    const ext = getFileExt(file);
    switch (operation) {
      case 'convert': {
        const acceptedTypes = getAcceptForOperation('convert');
        const allowedExtensions = Object.values(acceptedTypes).flat().map(e => e.substring(1));
        return allowedExtensions.includes(ext);
      }
      case 'edit':
        return ext === 'pdf';
      default:
        return false;
    }
  };

  // Process a single file (used by BatchQueue and batch processor)
  const processFile = async (file) => {
    try {
      const formData = createFormDataWithFiles(file, {
        operation: currentOperation,
      });

      const apiCall = (selectedOperation === 'convert') ? pdfApi.convert : pdfApi.edit;
      const result = await apiCall(formData, { responseType: 'blob' });
      const resultWithDetails = { ...result, originalName: file.name };
      setConvertedFiles(prev => [...prev, resultWithDetails]);
      addToRecent(resultWithDetails);
      handleClearSelection(); // Clear dropzone after successful conversion
      return resultWithDetails;
    } catch (err) {
      if (err instanceof AppError && err.status === 401) setShowAuthPopup(true);
      showPopup(`${currentOperation} operation failed: ${err.message}`);
      throw err;
    }
  };

  // Batch processing: start sequential processing of all uploaded files
  const startProcessingAll = async () => {
    if (uploadedFiles.length === 0) return showPopup('No files to process');
    setLoading(true);
    try {
      const formData = createFormDataWithFiles(uploadedFiles, {
        operation: currentOperation,
      });

      const apiCall = (selectedOperation === 'convert') ? pdfApi.convert : pdfApi.edit;
      const results = await apiCall(formData, { responseType: 'blob' });

      const newConvertedFiles = results.map((result, index) => {
        const originalFile = uploadedFiles[index];
        return { ...result, originalName: originalFile ? originalFile.name : `file_${index}` };
      });

      setConvertedFiles(prev => [...prev, ...newConvertedFiles]);
      newConvertedFiles.forEach(file => addToRecent(file));
      handleClearSelection();
      showPopup('Batch processing complete');
    } catch (err) {
      if (err instanceof AppError && err.status === 401) setShowAuthPopup(true);
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
        title={'Free PDF Converter | Convert Word, Excel, Images to PDF Online - MyConverterTool'}
        description={'Use our free PDF converter to convert Word to PDF, Excel to PDF, images to PDF, and more. Merge, split, compress PDFs online instantly.'}
        keywords={'pdf converter, word to pdf, excel to pdf, image to pdf, merge pdf, split pdf, compress pdf, online pdf tools'}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'PDF Converter',
          description: 'Free online PDF converter tool with support for multiple file formats',
          applicationCategory: 'DocumentManagement',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD'
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

      <div className="grid grid-cols-1 gap-6">
        {/* Operation selection cards - show when no operation selected */}
        {!selectedOperation && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'convert', title: 'Convert to PDF', desc: 'Convert DOCX, XLSX, Images, Markdown to PDF' },
              { key: 'edit', title: 'Edit PDF', desc: 'Split, rotate, delete pages from a PDF' },
            ].map(card => (
              <motion.div
                key={card.key}
                className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow cursor-pointer hover:shadow-lg transition"
                whileHover={{ scale: 1.02 }}
                onClick={() => {
                  setSelectedOperation(card.key);
                  setCurrentOperation(card.key === 'edit' ? 'edit' : card.key);
                }}
              >
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{card.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{card.desc}</p>
                <div className="mt-4 text-xs text-blue-500">Click to select</div>
              </motion.div>
            ))}
          </div>
        )}
        {/* Left Column - Upload and Convert (shown after selecting an operation) */}
        {selectedOperation && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-300">Selected: <span className="font-medium">{selectedOperation}</span></div>
              <button
                className="text-sm text-red-500 hover:underline"
                onClick={() => {
                  setSelectedOperation(null);
                  setUploadedFiles([]);
                  setConvertedFiles([]);
                  setViewingFile(null);
                }}
              >
                Go Back to Main Menu
              </button>
            </div>
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
              {selectedOperation === 'convert'
                ? 'Supports DOCX, XLSX, Images, Markdown, and more (PDF not allowed)'
                : 'Supports PDF files only'}
            </p>
          </motion.div>

          {/* Display uploaded file names */}
          {uploadedFiles.length > 0 && (
            <div className="mt-4">
              <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Uploaded Files:</h4>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
                {uploadedFiles.map((file, index) => (
                  <li key={index} className="flex items-center justify-between py-1">
                    <span className="truncate">{file.name}</span>
                    <button
                      onClick={() => {
                        const newFiles = uploadedFiles.filter((_, i) => i !== index);
                        setUploadedFiles(newFiles);
                        showPopup(`${file.name} removed.`);
                      }}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* PDF Operations: hide when user is doing an initial 'convert' until a PDF is produced */}
          {!(selectedOperation === 'convert' && convertedFiles.length === 0) && (
            <div className="mb-6">
              <PdfOperations
                onOperation={setCurrentOperation}
                loading={loading}
                currentOperation={currentOperation}
              />
            </div>
          )}
          
          {/* PDF Viewer for Edit operation */}
          {selectedOperation === 'edit' && uploadedFiles.length > 0 && uploadedFiles[0].type === 'application/pdf' && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Preview & Edit:</h4>
              <PdfViewer
                file={URL.createObjectURL(uploadedFiles[0])}
                filename={uploadedFiles[0].name}
                onFileUpdate={(newBlobUrl) => {
                  // Create a dummy File object for the updated PDF blob
                  const updatedFile = new File([newBlobUrl], uploadedFiles[0].name, { type: 'application/pdf' });
                  // Revoke the old URL to prevent memory leaks
                  URL.revokeObjectURL(URL.createObjectURL(uploadedFiles[0]));
                  // Update the uploadedFiles state with the new blob URL
                  setUploadedFiles([Object.assign(updatedFile, { preview: newBlobUrl })]);
                }}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            {uploadedFiles.length === 1 && canProcessSingle(uploadedFiles[0], selectedOperation) && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  setLoading(true);
                  await processFile(uploadedFiles[0]);
                  setLoading(false);
                }}
                disabled={loading || uploadedFiles.length === 0}
                className="flex items-center justify-center w-full sm:w-auto gap-2 py-2.5 px-4 rounded-lg text-white font-medium bg-blue-500 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-5 h-5" />
                {loading ? 'Converting...' : (selectedOperation === 'convert' ? 'Convert to PDF' : `Process ${uploadedFiles[0].name}`)}
              </motion.button>
            )}

            {uploadedFiles.length > 1 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startProcessingAll}
                disabled={loading || uploadedFiles.length === 0}
                className="flex items-center justify-center w-full sm:w-auto gap-2 py-2.5 px-4 rounded-lg text-white font-medium bg-blue-500 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-5 h-5" />
                {loading ? `Processing...` : 'Start Batch Processing'}
              </motion.button>
            )}

            {uploadedFiles.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClearSelection}
                className="flex items-center justify-center w-full sm:w-auto gap-2 py-2.5 px-4 rounded-lg text-white font-medium bg-red-500 hover:bg-red-600 transition-colors"
              >
                <X className="w-5 h-5" />
                Clear All
              </motion.button>
            )}
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="mt-4">
              <ConversionProgressBar
                message={'Converting files...'}
              />
            </div>
          )}

          {/* Display Converted Files and Download Button */}
          {convertedFiles.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Converted Files:</h4>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
                {convertedFiles.map((file, index) => {
                  const converted = file.filename ? file : (file[0] || {});
                  return (
                    <li key={index} className="flex items-center justify-between py-1">
                      <span className="truncate">{converted.filename || file.originalName}</span>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setViewingFile(converted)}
                          disabled={viewingFile && viewingFile.filename === converted.filename}
                          className="ml-2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            const downloadBtn = document.createElement('a');
                            downloadBtn.href = URL.createObjectURL(new Blob([converted.base64], { type: 'application/pdf' }));
                            downloadBtn.download = converted.filename;
                            document.body.appendChild(downloadBtn);
                            downloadBtn.click();
                            document.body.removeChild(downloadBtn);
                            showPopup(`${converted.filename} downloaded.`);
                          }}
                          className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                        >
                          Download
                        </motion.button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* PDF Viewer for Edit operation and Converted PDF */}
          {( (selectedOperation === 'edit' && uploadedFiles.length > 0 && uploadedFiles[0].type === 'application/pdf') || viewingFile) ? (
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Preview:</h4>
              <PdfViewer
                file={viewingFile ? URL.createObjectURL(new Blob([viewingFile.base64], { type: 'application/pdf' })) : URL.createObjectURL(uploadedFiles[0])}
                filename={viewingFile ? viewingFile.filename : uploadedFiles[0].name}
                onFileUpdate={(newBlobUrl) => {
                  // This part is primarily for 'edit' operations
                  if (selectedOperation === 'edit') {
                    const updatedFile = new File([newBlobUrl], uploadedFiles[0].name, { type: 'application/pdf' });
                    URL.revokeObjectURL(URL.createObjectURL(uploadedFiles[0]));
                    setUploadedFiles([Object.assign(updatedFile, { preview: newBlobUrl })]);
                  } else if (viewingFile) {
                    // For converted files, if there's an update, we might need to handle it differently
                    // For now, we'll just update the first converted file's URL
                    const updatedConvertedFile = { ...viewingFile, url: newBlobUrl };
                    setConvertedFiles(convertedFiles.map(f => f.filename === viewingFile.filename ? updatedConvertedFile : f));
                  }
                }}
              />
            </div>
          ) : null}

          {/* File History */}
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center">
              Total Conversions: 
              <motion.span
                key={totalConversions} // Key change to trigger animation on update
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="ml-2 text-blue-600 dark:text-blue-400"
              >
                {totalConversions}
              </motion.span>
              <span className="ml-4 flex items-center text-yellow-500">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279L12 18.896l-7.416 3.917 1.48-8.279L.001 9.306l8.332-1.151L12 .587z"/></svg>
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279L12 18.896l-7.416 3.917 1.48-8.279L.001 9.306l8.332-1.151L12 .587z"/></svg>
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279L12 18.896l-7.416 3.917 1.48-8.279L.001 9.306l8.332-1.151L12 .587z"/></svg>
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279L12 18.896l-7.416 3.917 1.48-8.279L.001 9.306l8.332-1.151L12 .587z"/></svg>
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279L12 18.896l-7.416 3.917 1.48-8.279L.001 9.306l8.332-1.151L12 .587z"/></svg>
              </span>
            </h4>
            {user ? (
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
            ) : (
              <div className="text-center p-4 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                <p className="mb-2">Login or Register to view your recent file conversions.</p>
                <button
                  onClick={() => setShowAuthPopup(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Login / Register
                </button>
              </div>
            )}
          </div>
        </div>
        )}

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
          setShowAuthPopup(false);
          if (downloadData) {
            handleDownload();
          } else if (convertedFiles.length > 0) {
            // If no specific downloadData, try to download the most recent converted file
            const latestConverted = convertedFiles[convertedFiles.length - 1];
            if (latestConverted && (latestConverted.base64 || latestConverted[0]?.base64)) {
              const fileData = latestConverted.base64 ? latestConverted : latestConverted[0];
              const downloadLink = document.createElement('a');
              downloadLink.href = `data:application/pdf;base64,${fileData.base64}`;
              downloadLink.download = fileData.filename || latestConverted.originalName || 'document.pdf';
              document.body.appendChild(downloadLink);
              downloadLink.click();
              document.body.removeChild(downloadLink);
              showPopup(`${fileData.filename || latestConverted.originalName} downloaded.`);
            } else {
              showPopup("No file available for download.");
            }
          } else {
            showPopup("No file available for download.");
          }
        }}
      />
    </motion.div>
  );
};

export default PdfConverter;
