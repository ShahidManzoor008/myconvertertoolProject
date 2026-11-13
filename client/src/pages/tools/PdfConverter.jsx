import { useToolWorkspace } from '../../hooks/useToolWorkspace';
import { useSearchParams } from 'react-router-dom';
import { safeStorage } from '../../utils/storage';
import { useState, useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';
import AuthPopup from '../../components/AuthPopup';
import SEO from "../../utils/SEO";
import ToolSupportSection from "../../components/ToolSupportSection";
const PdfViewer = lazy(() => import('../../components/PdfViewer'));
import ConversionProgressBar from '../../components/common/ConversionProgressBar';
import UploadedFilesList from '../../components/UploadedFilesList';
import ConvertedFilesList from '../../components/ConvertedFilesList';
import { AppError } from '../../utils/AppError';
import { useQuery } from '@tanstack/react-query';
import { statsApi } from '../../utils/apiClient';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useFileProcessing } from '../../hooks/useFileProcessing';
import { useConversionProgress } from '../../hooks/useConversionProgress';
import { downloadFile, getFileBlob } from '../../utils/fileDownloadUtils';

const PdfConverter = () => {
  const workspaceRef = useToolWorkspace();
  const [searchParams] = useSearchParams();
  const requestedMode = searchParams.get('mode') === 'view' ? 'view' : 'convert';
  const [selectedMode, setSelectedMode] = useState(requestedMode);
  const [, setRecentFiles] = useState([]);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [downloadData, setDownloadData] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewNeedsCleanup, setPreviewNeedsCleanup] = useState(false);
  const [viewerFileUrl, setViewerFileUrl] = useState("");
  const conversionProgress = useConversionProgress([
    { message: "Preparing files...", progress: 10 },
    { message: "Uploading files...", progress: 32 },
    { message: "Processing conversion...", progress: 58 },
    { message: "Packaging output...", progress: 82 },
  ]);

  // Add file to recent conversions
  const addToRecent = (file) => {
    const newFile = {
      ...file,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };

    setRecentFiles(prev => {
      const updated = [newFile, ...prev.slice(0, 4)]; // Keep only last 5 files
      const storedUpdated = updated.map((f) => {
        const fileData = f?.file ? f : (f?.[0] || f || {});
        const rest = { ...fileData };
        delete rest.base64;
        delete rest.blob;
        delete rest.file;
        delete rest.url;
        return rest;
      });

      try {
        safeStorage.setItem('recentFiles', JSON.stringify(storedUpdated));
      } catch (error) {
        if (error.name === 'QuotaExceededError') {
          safeStorage.removeItem('recentFiles');
          try {
            safeStorage.setItem('recentFiles', JSON.stringify(storedUpdated));
          } catch (e) {
            console.error("Still unable to save recent files after clearing.", e);
          }
        }
      }
      return updated;
    });

    refetchStats();
  };

  // Use custom hooks - must be after addToRecent definition
  const {
    uploadedFiles,
    popupMessage,
    getRootProps,
    getInputProps,
    handleClearSelection,
    removeFile,
    showPopup,
  } = useFileUpload(selectedMode);

  const {
    loading,
    setLoading,
    convertedFiles,
    canProcessSingle,
    processFile,
    startProcessingAll,
    clearConvertedFiles,
    removeConvertedFile,
  } = useFileProcessing(showPopup, addToRecent);

  // Fetch total conversions from server
  const { refetch: refetchStats } = useQuery({
    queryKey: ['totalConversions'],
    queryFn: async () => {
      const data = await statsApi.getTotal();
      return data.total;
    },
    initialData: 0
  });

  // Handle file download
  const handleDownload = () => {
    if (downloadData) {
      downloadFile(downloadData, downloadData.filename, showPopup);
      setShowAuthPopup(false);
      setDownloadData(null);
    }
  };

  // Load recent files from localStorage
  useEffect(() => {
    let loadedRecent = [];
    try { loadedRecent = JSON.parse(safeStorage.getItem('recentFiles') || '[]'); } catch { /* Optional history. */ }
    setRecentFiles(loadedRecent);
  }, []);

  const handleModeChange = (mode) => {
    setSelectedMode(mode);
    handleClearSelection();
    clearConvertedFiles();
    handleClosePreview();
  };

  useEffect(() => {
    if (selectedMode !== 'view' || uploadedFiles.length !== 1) {
      setViewerFileUrl("");
      return undefined;
    }

    const nextUrl = URL.createObjectURL(uploadedFiles[0]);
    setViewerFileUrl(nextUrl);
    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [selectedMode, uploadedFiles]);

  // Handle file preview
  const handlePreviewFile = (file) => {
    if (!file) return;

    if (previewNeedsCleanup && previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const fileBlob = getFileBlob(file);
    let resolvedUrl = file.url || '';
    let needsCleanup = false;

    if (!resolvedUrl && file.base64) {
      try {
        const byteCharacters = atob(file.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        resolvedUrl = URL.createObjectURL(blob);
        needsCleanup = true;
      } catch (error) {
        console.error('Failed to prepare PDF preview:', error);
      }
    } else if (fileBlob) {
      resolvedUrl = URL.createObjectURL(fileBlob);
      needsCleanup = true;
    }

    if (!resolvedUrl) {
      setPreviewFile(null);
      setPreviewUrl('');
      setPreviewNeedsCleanup(false);
      showPopup('Preview is not available for this file.');
      return;
    }

    setPreviewFile(file);
    setPreviewUrl(resolvedUrl);
    setPreviewNeedsCleanup(needsCleanup);
  };

  const handleClosePreview = () => {
    if (previewNeedsCleanup && previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewFile(null);
    setPreviewUrl('');
    setPreviewNeedsCleanup(false);
  };

  useEffect(() => {
    return () => {
      if (previewNeedsCleanup && previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewNeedsCleanup, previewUrl]);

  const selectedFileCount = uploadedFiles.length;
  const hasFiles = selectedFileCount > 0;

  const getActionState = () => {
    if (loading) return { disabled: true, reason: 'Processing...', label: 'Processing...' };
    if (!hasFiles) return { disabled: true, reason: 'Upload files to continue.', label: 'Convert' };
    return { disabled: false, reason: '', label: selectedFileCount > 1 ? 'Convert Batch' : 'Convert' };
  };

  const actionState = getActionState();

  // Handle file download from converted files list
  const handleDownloadFile = (file) => {
    const filename = file?.filename || file?.originalName || file?.name || 'document.pdf';
    downloadFile(file, filename, showPopup);
  };

  // Handle removal of converted file
  const handleRemoveConvertedFile = (index) => {
    const removedFile = convertedFiles[index];
    if (previewFile && (previewFile === removedFile || previewFile.id === removedFile?.id)) {
      handleClosePreview();
    }
    removeConvertedFile(index);
  };

  // Handle single file processing with auth check
  const handleProcessSingleFile = async () => {
    setLoading(true);
    conversionProgress.start();
    try {
      await processFile(uploadedFiles[0], 'convert', 'convert');
      conversionProgress.complete('File ready for download');
      handleClearSelection();
    } catch (err) {
      conversionProgress.fail('Processing failed');
      if (err instanceof AppError && err.status === 401) {
        setShowAuthPopup(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle batch processing with auth check
  const handleBatchProcessing = async () => {
    conversionProgress.start();
    try {
      await startProcessingAll(uploadedFiles, 'convert', 'convert');
      conversionProgress.complete('Batch ready for download');
      handleClearSelection();
    } catch (err) {
      conversionProgress.fail('Batch processing failed');
      if (err instanceof AppError && err.status === 401) {
        setShowAuthPopup(true);
      }
    }
  };

  return (
    <div className="pb-20">
      <SEO
        title={'Free PDF Converter | Convert Word, Excel, PowerPoint & More to PDF'}
        description={'Convert Word, Excel, PowerPoint, Markdown, text, and images to PDF online. Preview converted PDF files in your browser.'}
        keywords={'free pdf converter, convert Word to PDF, Excel to PDF, PowerPoint to PDF, Markdown to PDF, text to PDF, image to PDF, online PDF viewer'}
        canonicalUrl={'/tools/pdf-converter'}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'PDF Converter',
          description: 'Convert Word, Excel, PowerPoint, Markdown, text, and image files to PDF, then preview PDF files in your browser.',
          applicationCategory: 'DocumentManagement',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD'
          }
        }}
      />

      {/* Header */}
      <section className="tool-intro text-center py-12 md:py-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest border border-red-500/20 mb-6">
          <span aria-hidden="true" className="material-icons text-xs">description</span>
          PDF Tools
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 leading-tight">
          PDF <span className="text-red-600">Converter</span> &amp; Viewer
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Convert documents and images to PDF, or open a PDF in the online viewer. Preview converted files before downloading.
        </p>
      </section>

      <div ref={workspaceRef} id="tool-workspace" tabIndex={-1} role="region" aria-label="Tool workspace" className="max-w-5xl mx-auto px-4">
        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-lg w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleModeChange('convert')}
              className={`flex-1 sm:flex-none px-5 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${selectedMode === 'convert' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Convert
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('view')}
              className={`flex-1 sm:flex-none px-5 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${selectedMode === 'view' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              View PDF
            </button>
          </div>
        </div>

        {/* Workspace */}
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-1 sm:p-2"
          >
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 sm:p-10 shadow-inner">
              <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg">
                    <span aria-hidden="true" className="material-icons text-sm">settings</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Mode</p>
                    <h3 className="font-bold text-slate-900 dark:text-white capitalize">{selectedMode === 'convert' ? 'Convert to PDF' : 'Online PDF Viewer'}</h3>
                  </div>
                </div>
                <button
                  className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  onClick={() => {
                  handleClearSelection();
                  clearConvertedFiles();
                  handleClosePreview();
                }}
                >
                  Clear
                </button>
              </div>

              {/* File Dropzone */}
              <motion.div
                {...getRootProps()}
                whileHover={{ y: -2 }}
                className="group relative border-2 border-dashed border-slate-200 dark:border-slate-800 p-6 sm:p-10 text-center cursor-pointer rounded-2xl mb-6 hover:border-red-500/50 hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-all"
              >
                <input aria-label={selectedMode === 'convert' ? 'Choose files to convert' : 'Choose a PDF to view'} {...getInputProps()} />
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-red-500 group-hover:text-white group-hover:scale-110 transition-all shadow-sm">
                  <Upload className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Choose files or drop them here
                </h4>
                <span className="mb-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm">
                  <Upload size={16} /> Choose files
                </span>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {selectedMode === 'convert'
                    ? 'DOC/DOCX, XLS/XLSX, PPT/PPTX, JPG/PNG, Markdown and TXT. Up to 5 files, 75 MB each, 95 MB combined. Files are processed on our servers.'
                    : 'Choose one PDF to view it in your browser. The file stays on your device.'}
                </p>
              </motion.div>

              {/* Display uploaded file names */}
              <UploadedFilesList
                files={uploadedFiles}
                onRemoveFile={removeFile}
              />

              {selectedMode === 'view' && viewerFileUrl && (
                <div className="mb-10">
                  <Suspense fallback={<p role="status">Loading PDF preview…</p>}><PdfViewer
                    file={viewerFileUrl}
                    filename={uploadedFiles[0]?.name || 'document.pdf'}
                  /></Suspense>
                </div>
              )}

              {/* Action Buttons */}
              {selectedMode === 'convert' && <div className="mt-10 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 p-4 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Next Step</p>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Upload a document or image, then convert it to PDF.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <button
                    onClick={() => uploadedFiles.length > 1 ? handleBatchProcessing() : handleProcessSingleFile()}
                    disabled={actionState.disabled || (uploadedFiles.length === 1 && !canProcessSingle(uploadedFiles[0], 'convert'))}
                    className="btn-primary w-full !bg-red-600 hover:!bg-red-700 shadow-red-500/25 px-6 py-5 text-base sm:text-lg font-black disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Upload className="w-5 h-5" />
                    {actionState.label}
                  </button>

                  {uploadedFiles.length > 0 && (
                    <button
                      onClick={handleClearSelection}
                      className="w-full px-6 py-5 rounded-2xl border border-slate-200 dark:border-slate-800 font-black text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all text-base"
                    >
                      Reset
                    </button>
                  )}
                </div>
                {actionState.reason && (
                  <p className="mt-3 text-xs font-bold text-amber-600 dark:text-amber-400">{actionState.reason}</p>
                )}
              </div>}

              {/* Loading Indicator */}
              {conversionProgress.active && (
                <div className="mt-10">
                  <ConversionProgressBar
                    message={conversionProgress.message}
                    progress={conversionProgress.progress}
                    status={conversionProgress.status}
                    events={[
                      { label: 'Preparing files', active: conversionProgress.progress >= 10 },
                      { label: 'Uploading', active: conversionProgress.progress >= 32 },
                      { label: 'Converting', active: conversionProgress.progress >= 58 },
                      { label: 'Packaging', active: conversionProgress.progress >= 82 },
                    ]}
                  />
                </div>
              )}

              {/* Converted Files */}
              {convertedFiles.length > 0 && (
                <div className="mt-10">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Converted Files</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">View, download, or remove individual results.</p>
                    </div>
                  </div>
                  <ConvertedFilesList
                    files={convertedFiles}
                    onPreview={handlePreviewFile}
                    onDownload={handleDownloadFile}
                    onRemove={handleRemoveConvertedFile}
                  />
                </div>
              )}

              {previewFile && previewUrl && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-sm px-4 py-6 sm:px-6 sm:py-10 overflow-y-auto"
                >
                  <div className="max-w-5xl mx-auto">
                    <Suspense fallback={<p role="status">Loading PDF preview…</p>}><PdfViewer
                      file={previewUrl}
                      filename={previewFile.filename || previewFile.originalName || previewFile.name || 'document.pdf'}
                      onClose={handleClosePreview}
                    /></Suspense>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <ToolSupportSection currentPath="/tools/pdf-converter" category="PDF Tools" />
      </div>
      
      {/* Popups */}
      {popupMessage && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 right-8 z-[100]"
        >
          <div className="px-6 py-4 rounded-2xl bg-slate-900 text-white shadow-2xl flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-bold uppercase tracking-widest">{popupMessage}</span>
          </div>
        </motion.div>
      )}

      <AuthPopup
        isOpen={showAuthPopup}
        onClose={() => setShowAuthPopup(false)}
        onLogin={async () => {
          setShowAuthPopup(false);
          setTimeout(() => handleDownload(), 500);
        }}
        onSkip={() => {
          setShowAuthPopup(false);
          if (downloadData) {
            handleDownload();
          } else if (convertedFiles.length > 0) {
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
            }
          }
        }}
      />
    </div>
  );
};

export default PdfConverter;
