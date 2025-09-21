import { useState, useCallback, useEffect, useRef } from 'react';
import { Document, Page } from 'react-pdf';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2,
  Download,
  Loader,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import ThumbnailsSidebar from './ThumbnailsSidebar';
import SearchBar from './SearchBar';
import AnnotationTools from './AnnotationTools';
import setupPdfWorker, { PDF_VIEWER_OPTIONS } from '../utils/pdfWorker';

// Initialize PDF worker
setupPdfWorker();

// Memory management
const CLEAN_UP_DELAY = 1000; // 1 second delay before cleanup

const PdfViewer = ({ file, filename }) => {
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
  const pdfDocumentRef = useRef(null);

  // Clean up resources when unmounting or changing files
  useEffect(() => {
    let cleanup = null;

    const cleanupResources = () => {
      // Clear any cached page objects
      if (pdfDocumentRef.current) {
        try {
          pdfDocumentRef.current.cleanup();
          pdfDocumentRef.current.destroy();
        } catch (e) {
          console.error('Error cleaning up PDF:', e);
        }
        pdfDocumentRef.current = null;
      }
    };

    // Initialize PDF document
    if (file) {
      import('pdfjs-dist').then(({ getDocument }) => {
        getDocument(file).promise.then(pdf => {
          pdfDocumentRef.current = pdf;
        }).catch(console.error);
      });
    }

    return () => {
      // Delay cleanup to prevent flickering during page changes
      if (cleanup) clearTimeout(cleanup);
      cleanup = setTimeout(cleanupResources, CLEAN_UP_DELAY);
    };
  }, [file]);

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    // Pre-fetch next page for smoother navigation
    if (numPages > 1) {
      import('pdfjs-dist').then(({ getDocument }) => {
        getDocument(file).promise.then(doc => {
          // Pre-fetch next page silently
          doc.getPage(2).catch(() => {});
        }).catch(() => {});
      });
    }
  }, [file]);

  const onDocumentLoadError = (error) => {
    console.error('PDF Load Error:', error);
    setError(error.message === 'Failed to fetch'
      ? 'Failed to load PDF. Please check your internet connection.'
      : `Error loading PDF: ${error.message}`);
    setLoading(false);
  };

  const handlePrevPage = () => {
    setPageNumber(page => Math.max(page - 1, 1));
  };

  const handleNextPage = () => {
    setPageNumber(page => Math.min(page + 1, numPages));
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

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file;
    link.download = filename || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              onClick={handleDownload}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
              title="Download PDF"
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
            onPageChange={setPageNumber}
          />
        )}

        {/* PDF Document */}
        <div className="flex-1 relative overflow-auto p-4">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <Loader className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-2">Loading PDF...</span>
            </div>
          )}
          
          {error && (
            <div className="flex items-center justify-center h-full text-red-500">
              {error}
            </div>
          )}

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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex justify-center"
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
};

export default PdfViewer;