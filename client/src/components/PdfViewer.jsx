import { useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import PropTypes from 'prop-types';
import LoadingSpinner from './common/LoadingSpinner';
import { X } from 'lucide-react';
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

const PdfViewer = ({ file, filename, onClose }) => {
  const [numPages, setNumPages] = useState(null);
  const [loadError, setLoadError] = useState('');

  // Defensive re-pin: if react-pdf (or anything else) overrode workerSrc
  // after our module-level assignment, snap it back to our bundled worker
  // before any <Document> is rendered.
  useEffect(() => {
    if (pdfjs.GlobalWorkerOptions.workerSrc !== pdfWorkerUrl) {
      pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    }
  }, []);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setLoadError('');
    setNumPages(numPages);
  };

  return (
    <div className="pdf-viewer-container glass rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-xl glass hover:bg-red-500 hover:text-white transition-all z-10"
      >
        <X size={20} />
      </button>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center pr-12">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Preview: {filename}</h3>
        </div>
        
        <div className="max-h-[600px] overflow-y-auto scrollbar-hide bg-slate-50 dark:bg-slate-800 rounded-2xl p-4">
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => setLoadError(error?.message || 'Failed to load PDF')}
            loading={<LoadingSpinner message="Loading PDF..." />}
          >
            {Array.from(new Array(numPages), (el, index) => (
              <div key={`page_${index + 1}`} id={`pdf-page-${index + 1}`} className="mb-4 shadow-lg rounded-xl overflow-hidden flex justify-center">
                <Page pageNumber={index + 1} />
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
  onClose: PropTypes.func.isRequired,
};

export default PdfViewer;
