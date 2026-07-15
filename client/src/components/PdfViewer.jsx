import { useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import PropTypes from 'prop-types';
import LoadingSpinner from './common/LoadingSpinner';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Pin the worker to the exact same build bundled with pdfjs-dist so the
// API and worker versions always match (avoids "API version X does not
// match Worker version Y" errors caused by duplicate installs).
//
// `react-pdf` overwrites `workerSrc` on its internal pdfjs instance at
// import-time. We re-apply our URL on every mount (after all imports have
// run) using the same `pdfjs` reference exported by react-pdf, so both
// instances point at the same worker and the same package version.
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const PdfViewer = ({ file, filename, onClose, onLoadSuccess }) => {
  const [numPages, setNumPages] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [containerWidth, setContainerWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const viewportRef = useRef(null);

  // Defensive re-pin: if react-pdf (or anything else) overrode workerSrc
  // after our module-level assignment, snap it back to our bundled worker
  // before any <Document> is rendered.
  useEffect(() => {
    if (pdfjs.GlobalWorkerOptions.workerSrc !== pdfWorkerUrl) {
      pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    }
  }, []);

  useEffect(() => {
    if (!viewportRef.current) return undefined;

    const updateWidth = () => {
      setContainerWidth(viewportRef.current?.clientWidth || 0);
    };
    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(viewportRef.current);
    window.addEventListener('orientationchange', updateWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('orientationchange', updateWidth);
    };
  }, []);

  const pageWidth = useMemo(() => {
    if (!containerWidth) return undefined;
    const horizontalPadding = window.innerWidth < 640 ? 16 : 32;
    return Math.max(240, Math.min(920, containerWidth - horizontalPadding) * zoom);
  }, [containerWidth, zoom]);

  const handleDocumentLoadSuccess = (document) => {
    setLoadError('');
    setNumPages(document.numPages);
    onLoadSuccess?.(document);
  };

  return (
    <div className="pdf-viewer-container glass rounded-2xl sm:rounded-3xl p-3 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative w-full">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 pr-10 sm:pr-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">PDF Preview</p>
            <h3 className="truncate text-sm font-black text-slate-900 dark:text-white">{filename}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoom((value) => Math.max(0.65, Number((value - 0.1).toFixed(2))))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-red-500 hover:text-red-600 dark:border-slate-800 dark:text-slate-300"
              title="Zoom out"
            >
              <ZoomOut size={18} />
            </button>
            <span className="min-w-14 text-center text-xs font-black text-slate-500">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((value) => Math.min(1.6, Number((value + 0.1).toFixed(2))))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-red-500 hover:text-red-600 dark:border-slate-800 dark:text-slate-300"
              title="Zoom in"
            >
              <ZoomIn size={18} />
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-red-500 hover:bg-red-500 hover:text-white dark:border-slate-800 dark:text-slate-300"
                title="Close preview"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
        
        <div ref={viewportRef} className="max-h-[70vh] sm:max-h-[680px] overflow-auto overscroll-contain rounded-2xl bg-slate-50 p-2 dark:bg-slate-800 sm:p-4">
          <Document
            file={file}
            onLoadSuccess={handleDocumentLoadSuccess}
            onLoadError={(error) => setLoadError(error?.message || 'Failed to load PDF')}
            loading={<LoadingSpinner message="Loading PDF..." />}
          >
            {Array.from(new Array(numPages), (el, index) => (
              <div key={`page_${index + 1}`} id={`pdf-page-${index + 1}`} className="mb-4 flex justify-center overflow-hidden rounded-xl shadow-lg">
                <Page
                  pageNumber={index + 1}
                  width={pageWidth}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                />
              </div>
            ))}
          </Document>
        </div>
        {loadError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
            {loadError}
          </div>
        )}
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
  onClose: PropTypes.func,
  onLoadSuccess: PropTypes.func,
};

PdfViewer.defaultProps = {
  filename: 'document.pdf',
  onClose: null,
  onLoadSuccess: null,
};

export default PdfViewer;
