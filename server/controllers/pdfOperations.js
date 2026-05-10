import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import * as pdfExtractImage from 'pdf-extract-image';
import { createZipArchive } from '../utils/archiveUtils.js';
import { logConversion } from '../utils/statsUtils.js';

// Helper function to load PDF file
async function loadPDF(filePath) {
  const pdfBytes = await fs.readFile(filePath);
  return await PDFDocument.load(pdfBytes);
}

// Merge multiple PDFs
async function mergePDFs(files) {
  if (!Array.isArray(files) || files.length < 2) {
    throw new Error('Merge PDFs requires at least two files.');
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
    throw new Error('Split PDF requires a file and at least one range.');
  }
  const pdf = await loadPDF(file.path);
  const results = [];
  
  for (const range of ranges) {
    if (!Array.isArray(range) || range.length !== 2 || !range.every(Number.isInteger)) {
      throw new Error('Each range must be an array of two integers.');
    }
    const newPdf = await PDFDocument.create();
    const pages = await newPdf.copyPages(pdf, range);
    pages.forEach(page => newPdf.addPage(page));
    results.push(await newPdf.save());
  }
  
  return results;
}

// Rotate PDF pages
async function rotatePDF(file, rotations) {
  if (!file || !Array.isArray(rotations) || rotations.length === 0) {
    throw new Error('Rotate PDF requires a file and at least one rotation.');
  }
  const pdf = await loadPDF(file.path);
  
  rotations.forEach(({ pageIndex, angle }) => {
    if (typeof pageIndex !== 'number' || typeof angle !== 'number') {
      throw new Error('Each rotation must have a pageIndex (number) and angle (number).');
    }
    const page = pdf.getPage(pageIndex);
    // pdf-lib expects a Rotation object; use degrees()
    page.setRotation(degrees(angle));
  });
  
  return await pdf.save();
}

// Reorder PDF pages
async function reorderPDF(file, order) {
  if (!file || !Array.isArray(order) || order.length === 0) {
    throw new Error('Reorder PDF requires a file and an order array.');
  }
  if (!order.every(Number.isInteger)) {
    throw new Error('Order array must contain only integers.');
  }
  const pdf = await loadPDF(file.path);
  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(pdf, order);
  pages.forEach(page => newPdf.addPage(page));
  return await newPdf.save();
}

// Extract images from PDF
async function extractImages(file) {
  if (!file) {
    throw new Error('Extract images requires a file.');
  }
  const images = await pdfExtractImage.extractImagesFromPdf(file.path);
  const imagePaths = [];
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const imagePath = path.join('uploads', `image_${i}.png`);
    await fs.writeFile(imagePath, image);
    imagePaths.push({ path: imagePath, name: `image_${i}.png` });
  }
  return imagePaths;
}

// Add watermark to PDF
async function addWatermark(file, watermarkText, options = {}) {
  if (!file || !watermarkText) {
    throw new Error('Add watermark requires a file and watermark text.');
  }
  const pdf = await loadPDF(file.path);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  
  const pages = pdf.getPages();
  pages.forEach(page => {
    const { width, height } = page.getSize();
    page.drawText(watermarkText, {
      x: width / 2,
      y: height / 2,
      font,
      size: options.fontSize || 50,
      opacity: options.opacity || 0.3,
      color: rgb(0.5, 0.5, 0.5),
      rotate: options.rotate || 45,
    });
  });
  
  return await pdf.save();
}

// Protect PDF with password
async function protectPDF(file, password) {
  if (!file || !password) {
    throw new Error('Protect PDF requires a file and a password.');
  }
  const pdf = await loadPDF(file.path);
  pdf.encrypt({
    userPassword: password,
    ownerPassword: password,
    permissions: {
      printing: 'highResolution',
      modifying: false,
      copying: false,
      annotating: false,
      fillingForms: true,
      contentAccessibility: true,
      documentAssembly: false,
    },
  });
  
  return await pdf.save();
}

// Compress PDF (basic implementation - for demonstration)
// This function performs a basic re-saving of the PDF, which can offer some
// file size reduction by optimizing the PDF structure. However, it does not
// perform advanced compression techniques like image downsampling, re-compression,
// or font subsetting. For more significant compression, external tools (e.g., Ghostscript)
// or more complex programmatic image/font manipulation would be required.
async function compressPDF(file) {
  if (!file) {
    throw new Error('Compress PDF requires a file.');
  }
  const pdf = await loadPDF(file.path);
  return await pdf.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });
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