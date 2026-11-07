import { randomUUID } from 'node:crypto';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { createZipArchive } from '../utils/archiveUtils.js';
import { logConversion } from '../utils/statsUtils.js';

// Helper function to load PDF file
async function loadPDF(filePath) {
  const pdfBytes = await fs.readFile(filePath);
  try {
    const document = await PDFDocument.load(pdfBytes, { throwOnInvalidObject: true });
    if (!document.getPageCount()) throw new Error('No usable PDF pages.');
    return document;
  }
  catch { throw Object.assign(new Error('This PDF is corrupt, encrypted, or unsupported.'), { statusCode: 400 }); }
}

// Merge multiple PDFs
async function mergePDFs(files) {
  if (!Array.isArray(files) || files.length < 2) {
    throw Object.assign(new Error('Merge PDFs requires at least two files.'), { statusCode: 400 });
  }
  const mergedPdf = await PDFDocument.create();
  
  for (const file of files) {
    const pdf = await loadPDF(file.path);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach(page => mergedPdf.addPage(page));
  }
  
  return await mergedPdf.save();
}

// Split PDF into multiple documents
async function splitPDF(file, ranges) {
  if (!file || !Array.isArray(ranges) || ranges.length === 0) {
    throw Object.assign(new Error('Split PDF requires a file and at least one range.'), { statusCode: 400 });
  }
  const pdf = await loadPDF(file.path);
  const results = [];
  
  for (const range of ranges) {
    if (!Array.isArray(range) || range.length !== 2 || !range.every(Number.isInteger)) {
      throw Object.assign(new Error('Each range must be an array of two integers.'), { statusCode: 400 });
    }
    const [start, end] = range;
    if (start < 0 || end < start || end >= pdf.getPageCount()) {
      throw Object.assign(new Error(`Invalid page range ${start + 1}-${end + 1}.`), { statusCode: 400 });
    }
    const newPdf = await PDFDocument.create();
    const pageIndices = Array.from({ length: end - start + 1 }, (_, index) => start + index);
    const pages = await newPdf.copyPages(pdf, pageIndices);
    pages.forEach(page => newPdf.addPage(page));
    results.push(await newPdf.save());
  }
  
  return results;
}

// Rotate PDF pages
async function rotatePDF(file, rotations) {
  if (!file || !Array.isArray(rotations) || rotations.length === 0) {
    throw Object.assign(new Error('Rotate PDF requires a file and at least one rotation.'), { statusCode: 400 });
  }
  const pdf = await loadPDF(file.path);
  
  if (rotations.some(rotation => !rotation || typeof rotation !== 'object' || Array.isArray(rotation))) throw Object.assign(new Error('Each rotation must be an object with a page index and angle.'), { statusCode: 400 });
  rotations.forEach(({ pageIndex, angle }) => {
    if (typeof pageIndex !== 'number' || typeof angle !== 'number') {
      throw Object.assign(new Error('Each rotation must have a pageIndex (number) and angle (number).'), { statusCode: 400 });
    }
    if (!Number.isInteger(pageIndex) || pageIndex < 0 || pageIndex >= pdf.getPageCount() || !Number.isFinite(angle) || angle % 90 !== 0) throw Object.assign(new Error('Use a valid page index and a rotation divisible by 90.'), { statusCode: 400 });
    const page = pdf.getPage(pageIndex);
    // pdf-lib expects a Rotation object; use degrees()
    page.setRotation(degrees(angle));
  });
  
  return await pdf.save();
}

// Reorder PDF pages
async function reorderPDF(file, order) {
  if (!file || !Array.isArray(order) || order.length === 0) {
    throw Object.assign(new Error('Reorder PDF requires a file and an order array.'), { statusCode: 400 });
  }
  if (!order.every(Number.isInteger)) {
    throw Object.assign(new Error('Order array must contain only integers.'), { statusCode: 400 });
  }
  const pdf = await loadPDF(file.path);
  const newPdf = await PDFDocument.create();
  if (order.some(index => index < 0 || index >= pdf.getPageCount())) throw Object.assign(new Error('Page order contains an invalid page index.'), { statusCode: 400 });
  const pages = await newPdf.copyPages(pdf, order);
  pages.forEach(page => newPdf.addPage(page));
  return await newPdf.save();
}

// Extract images from PDF
async function extractImages(file) {
  if (!file) {
    throw Object.assign(new Error('Extract images requires a file.'), { statusCode: 400 });
  }
  const pdfExtractImage = await import('pdf-extract-image');
  const images = await pdfExtractImage.extractImagesFromPdf(file.path);
  const imagePaths = [];
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const imagePath = path.join('uploads', `image_${randomUUID()}_${i}.png`);
    await fs.writeFile(imagePath, image);
    imagePaths.push({ path: imagePath, name: `image_${i}.png` });
  }
  return imagePaths;
}

// Add watermark to PDF
async function addWatermark(file, watermarkText, options = {}) {
  if (!file || typeof watermarkText !== 'string' || !watermarkText.trim() || watermarkText.length > 1000) {
    throw Object.assign(new Error('Add watermark requires a file and watermark text.'), { statusCode: 400 });
  }
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw Object.assign(new Error('Watermark options must be an object.'), { statusCode: 400 });
  const size = options.fontSize ?? 50, opacity = options.opacity ?? 0.3, angle = options.rotate ?? 45;
  if (!Number.isFinite(size) || size <= 0 || size > 300 || !Number.isFinite(opacity) || opacity < 0 || opacity > 1 || !Number.isFinite(angle)) throw Object.assign(new Error('Use a font size up to 300, opacity from 0 to 1, and a finite rotation.'), { statusCode: 400 });
  const pdf = await loadPDF(file.path);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  try { font.encodeText(watermarkText); }
  catch { throw Object.assign(new Error('This watermark contains characters unsupported by the available font.'), { statusCode: 400 }); }

  const pages = pdf.getPages();
  pages.forEach(page => {
    const { width, height } = page.getSize();
    page.drawText(watermarkText, {
      x: width / 2,
      y: height / 2,
      font,
      size,
      opacity,
      color: rgb(0.5, 0.5, 0.5),
      rotate: degrees(angle),
    });
  });
  
  return await pdf.save();
}

// Protect PDF with password
async function protectPDF(file, password) {
  // pdf-lib does not support encryption directly.
  // This would require an external tool like qpdf or a specialized library like muhammara.
  // Returning 501 for now to acknowledge it's not implemented.
  const error = new Error('PDF protection (encryption) is not currently supported.');
  error.statusCode = 501;
  throw error;
}

// Compress PDF (basic implementation - for demonstration)
// This function performs a basic re-saving of the PDF, which can offer some
// file size reduction by optimizing the PDF structure. However, it does not
// perform advanced compression techniques like image downsampling, re-compression,
// or font subsetting. For more significant compression, external tools (e.g., Ghostscript)
// or more complex programmatic image/font manipulation would be required.
async function compressPDF(file) {
  if (!file) {
    throw Object.assign(new Error('Compress PDF requires a file.'), { statusCode: 400 });
  }
  const pdf = await loadPDF(file.path);
  const optimized = await pdf.save({ useObjectStreams: true, addDefaultPage: false });
  const original = await fs.readFile(file.path);
  return optimized.length < original.length ? optimized : original;
}

export {
  mergePDFs,
  splitPDF,
  rotatePDF,
  reorderPDF,
  extractImages,
  addWatermark,
  protectPDF,
  compressPDF,
};
