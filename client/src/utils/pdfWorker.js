import { pdfjs } from 'react-pdf';

// Version management for PDF.js worker
const PDFJS_VERSION = '3.5.141'; // Match this with your pdf.js version

// Configure worker
const setupPdfWorker = () => {
  try {
    if (pdfjs.GlobalWorkerOptions.workerSrc) return;
    pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;
  } catch (error) {
    console.error('Failed to setup PDF worker:', error);
  }
};

// PDF viewer options for better performance
export const PDF_VIEWER_OPTIONS = {
  cMapUrl: 'cmaps/',
  cMapPacked: true,
  standardFontDataUrl: 'standard_fonts/',
  disableAutoFetch: true,
  disableStream: false,
  maxImageSize: 1024 * 1024,
  isEvalSupported: false,
  disableFontFace: false
};

export default setupPdfWorker;