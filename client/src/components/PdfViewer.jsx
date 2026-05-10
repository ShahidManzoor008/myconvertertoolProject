import { useState, useCallback, useEffect, useRef, createRef } from 'react';
import { Document, Page } from 'react-pdf';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import LoadingSpinner from './common/LoadingSpinner'; // Import LoadingSpinner
// import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'; // No longer needed for client-side manipulation
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2,
  Download,
  Loader,
  PanelLeftClose,
  PanelLeftOpen,
  Plus, // For adding pages
  Trash2, // For deleting pages
  Save, // For saving PDF
  Type, // For adding text
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import ThumbnailsSidebar from './ThumbnailsSidebar';
import SearchBar from './SearchBar';
import AnnotationTools from './AnnotationTools';
import { apiClient } from '../utils/apiClient'; // Import apiClient
import { useInView } from 'react-intersection-observer';

const PDF_VIEWER_OPTIONS = {
  cMapUrl: 'cmaps/',
  cMapPacked: true,
  standardFontDataUrl: 'standard_fonts/',
  disableAutoFetch: true,
  disableStream: false,
  // maxImageSize: 1024 * 1024, // Removed to allow larger images
  isEvalSupported: false,
  disableFontFace: false
};

const PageWithObserver = ({ pageNumber, scale, handleMouseMove, handlePageClick, onVisibilityChange }) => {
  const { ref } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView) {
        onVisibilityChange(pageNumber);
      }
    }
  });

  return (
    <div ref={ref} className="mb-4">
      <motion.div
        key={`page_${pageNumber}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex justify-center relative"
        onMouseMove={handleMouseMove}
        onClick={handlePageClick}
      >
        <Page
          pageNumber={pageNumber}
          scale={scale}
          renderTextLayer={true}
          renderAnnotationLayer={true}
          loading={
            <div className="flex items-center justify-center w-full h-[600px]">
              <Loader className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          }
        />
      </motion.div>
    </div>
  );
};

PageWithObserver.propTypes = {
  pageNumber: PropTypes.number.isRequired,
  scale: PropTypes.number.isRequired,
  handleMouseMove: PropTypes.func.isRequired,
  handlePageClick: PropTypes.func.isRequired,
  onVisibilityChange: PropTypes.func.isRequired,
};


const PdfViewer = ({ file, filename, onFileUpdate }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchResult, setCurrentSearchResult] = useState(0);
  const [annotations, setAnnotations] = useState([]);
  // const [pdfDoc, setPdfDoc] = useState(null); // No longer needed for client-side pdf-lib object
  // const fileReaderRef = useRef(null); // No longer needed
  const [textToAdd, setTextToAdd] = useState(''); // State for text to add
  const [isAddingText, setIsAddingText] = useState(false); // State to control text adding mode
  const pageRefs = useRef([]);

  useEffect(() => {
    // Initialize refs array
    if (numPages) {
      pageRefs.current = pageRefs.current.slice(0, numPages);
      for (let i = 0; i < numPages; i++) {
        pageRefs.current[i] = pageRefs.current[i] || createRef();
      }
    }
  }, [numPages]);

  const scrollToPage = (page) => {
    setPageNumber(page);
    const pageElement = document.getElementById(`page-${page}`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Remove the useEffect that loads pdf-lib document, as it's now backend-handled
  useEffect(() => {
    if (file) {
      setLoading(true);
      // We still need to load the PDF for react-pdf to display it
      // The actual pdf-lib document will be loaded on the backend
      // This useEffect is now primarily for react-pdf's initial load state
      setLoading(false); // Assuming react-pdf's onLoadSuccess will handle actual loading
    }
  }, [file]);

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  }, []);

  const onDocumentLoadError = (error) => {
    console.error('PDF Load Error:', error);
    setError(error.message === 'Failed to fetch'
      ? 'Failed to load PDF. Please check your internet connection.'
      : `Error loading PDF: ${error.message}`);
    setLoading(false);
  };

  const handleZoomIn = () => {
    setScale(scale => Math.min(scale + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale(scale => Math.max(scale - 0.2, 0.5));
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = file;
    link.download = filename || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [file, filename]);

  const handleSearch = useCallback((text) => {
    if (!text) {
      setSearchResults([]);
      setCurrentSearchResult(0);
      return;
    }
    // Implement PDF text search logic here
    // This would typically involve using pdf.js to search through the document
    // For now, we'll just simulate some results
    setSearchResults([
      { page: 1, text: text },
      { page: 2, text: text }
    ]);
    setCurrentSearchResult(1);
  }, []);

  const handleAnnotation = useCallback((annotationData) => {
    setAnnotations(prev => [...prev, { ...annotationData, page: pageNumber }]);
  }, [pageNumber]);

  const handleAnnotationSave = useCallback(() => {
    // Here you would typically save the annotations to a backend or local storage
    console.log('Saving annotations:', annotations);
  }, [annotations]);

  const handleAnnotationClear = useCallback(() => {
    setAnnotations([]);
  }, []);

  const performPdfOperation = useCallback(async (endpoint, body = {}) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      // If file is a Blob URL, fetch the Blob first
      if (typeof file === 'string' && file.startsWith('blob:')) {
        const response = await fetch(file);
        const blob = await response.blob();
        formData.append('file', blob, filename || 'document.pdf');
      } else if (file instanceof File) {
        formData.append('file', file);
      } else {
        throw new Error("Invalid file type for PDF operation.");
      }

      for (const key in body) {
        formData.append(key, body[key]);
      }

      const response = await apiClient.upload(`/api${endpoint}`, formData, {
        headers: {
          // 'Content-Type': 'multipart/form-data', // apiClient.upload handles this
        },
        responseType: 'blob', // Expecting a blob response (the PDF file)
      });

      const newBlobUrl = URL.createObjectURL(response.data);
      onFileUpdate(newBlobUrl);
      // After successful operation, re-fetch numPages for react-pdf
      // This is a workaround as react-pdf doesn't expose a way to update numPages directly
      // A full re-load of the Document component might be needed for accurate page count
      // For now, we'll rely on the onDocumentLoadSuccess to update numPages

    } catch (err) {
      console.error(`Error performing PDF operation (${endpoint}):`, err);
      setError(`Failed to perform operation: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [file, filename, onFileUpdate]);

  const handleAddPage = useCallback(async () => {
    await performPdfOperation('/pdf-editor/add-page');
  }, [performPdfOperation]);

  const handleDeletePage = useCallback(async () => {
    // Note: pageIndex is 0-indexed for pdf-lib on backend
    await performPdfOperation('/pdf-editor/delete-page', { pageIndex: pageNumber - 1 });
  }, [pageNumber, performPdfOperation]);

  const handleAddText = useCallback(async (x, y) => {
    if (textToAdd) {
      await performPdfOperation('/pdf-editor/add-text', {
        text: textToAdd,
        pageIndex: pageNumber - 1,
        x: x, // Use dynamic x
        y: y, // Use dynamic y
        size: 24,
        color: { r: 0, g: 0, b: 0 }, // Black color
      });
      setTextToAdd(''); // Clear text input
      setIsAddingText(false); // Exit text adding mode
    }
  }, [textToAdd, pageNumber, performPdfOperation]);

  const handlePageClick = useCallback((event) => {
    if (isAddingText && textToAdd) {
      const rect = event.target.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = rect.height - (event.clientY - rect.top); // PDF coordinates are from bottom-left
      handleAddText(x, y); // Call handleAddText with the clicked coordinates
    }
  }, [isAddingText, textToAdd, handleAddText]);

  const handleMouseMove = useCallback(() => {
    if (isAddingText) {
      // Mouse move handling for text input positioning
      console.log('Mouse moved while adding text');
    }
  }, [isAddingText]);

  const handleSavePdf = useCallback(async () => {
    // The backend operations already return the modified PDF for download.
    // This button can trigger a generic save if needed, or just rely on the download from other operations.
    // For now, we'll just trigger a download of the current file displayed.
    handleDownload();
  }, [handleDownload]);

  const handlePrevPage = () => {
    const newPage = Math.max(pageNumber - 1, 1);
    scrollToPage(newPage);
  };

  const handleNextPage = () => {
    const newPage = Math.min(pageNumber + 1, numPages);
    scrollToPage(newPage);
  };

  return (
    <div className={`pdf-viewer bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-700 p-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {/* Search Bar */}
          <div className="flex-1">
            <SearchBar
              onSearch={handleSearch}
              onNextResult={() => setCurrentSearchResult(curr => Math.min(curr + 1, searchResults.length))}
              onPrevResult={() => setCurrentSearchResult(curr => Math.max(curr - 1, 1))}
              totalResults={searchResults.length}
              currentResult={currentSearchResult}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowThumbnails(!showThumbnails)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
              title={showThumbnails ? "Hide Thumbnails" : "Show Thumbnails"}
            >
              {showThumbnails ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>
            <button
              onClick={handleAddPage}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
              title="Add Page"
              disabled={loading}
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={handleDeletePage}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
              title="Delete Current Page"
              disabled={loading || numPages <= 1}
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsAddingText(true)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
              title="Add Text"
              disabled={loading}
            >
              <Type className="w-5 h-5" />
            </button>
            <button
              onClick={handleSavePdf}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
              title="Save PDF"
              disabled={loading}
            >
              <Save className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
              title="Download Original PDF"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isAddingText && (
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              value={textToAdd}
              onChange={(e) => setTextToAdd(e.target.value)}
              placeholder="Enter text to add"
              className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:text-gray-100"
            />
            <button
              onClick={handleAddText}
              className="p-2 rounded-md bg-blue-500 text-white hover:bg-blue-600"
              disabled={loading || !textToAdd}
            >
              Add
            </button>
            <button
              onClick={() => setIsAddingText(false)}
              className="p-2 rounded-md bg-gray-300 text-gray-800 hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="flex items-center gap-4">
          {/* Page Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={pageNumber <= 1}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
              title="Previous Page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm">
              Page {pageNumber} of {numPages || '--'}
            </span>
            <button
              onClick={handleNextPage}
              disabled={pageNumber >= numPages}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
              title="Next Page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-sm">{Math.round(scale * 100)}%</span>
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-10rem)]">
        {/* Thumbnails Sidebar */}
        {showThumbnails && (
          <ThumbnailsSidebar
            file={file}
            numPages={numPages}
            currentPage={pageNumber}
            onPageChange={scrollToPage}
          />
        )}

        {/* PDF Document */}
        <div className="flex-1 relative overflow-auto p-4">
          {loading && (
            <LoadingSpinner message="Loading PDF..." />
          )}
          
          {error && (
            <div className="flex items-center justify-center h-full text-red-500">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="flex">
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                options={PDF_VIEWER_OPTIONS}
                loading={
                  <div className="flex items-center justify-center">
                    <Loader className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                }
                error={
                  <div className="flex items-center justify-center text-red-500">
                    <p>Failed to load PDF. Please try again.</p>
                  </div>
                }
                noData={
                  <div className="flex items-center justify-center text-gray-500">
                    <p>No PDF file selected.</p>
                  </div>
                }
                renderMode="canvas"
              >
                {Array.from(new Array(numPages), (el, index) => (
                  <div id={`page-${index + 1}`} key={`page-container-${index + 1}`}>
                    <PageWithObserver
                      pageNumber={index + 1}
                      scale={scale}
                      handleMouseMove={handleMouseMove}
                      handlePageClick={handlePageClick}
                      onVisibilityChange={setPageNumber}
                    />
                  </div>
                ))}
              </Document>

              {/* Annotation Tools */}
              <div className="absolute right-4 top-4">
                <AnnotationTools
                  onAnnotate={handleAnnotation}
                  annotations={annotations}
                  onSave={handleAnnotationSave}
                  onClear={handleAnnotationClear}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

PdfViewer.propTypes = {
  file: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
  ]).isRequired,
  filename: PropTypes.string,
  onFileUpdate: PropTypes.func.isRequired,
};

export default PdfViewer;