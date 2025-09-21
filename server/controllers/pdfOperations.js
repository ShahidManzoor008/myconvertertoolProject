import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';
import { createWriteStream } from 'fs';

// Helper function to load PDF file
async function loadPDF(filePath) {
  const pdfBytes = await fs.readFile(filePath);
  return await PDFDocument.load(pdfBytes);
}

// Merge multiple PDFs
async function mergePDFs(files) {
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
  const pdf = await loadPDF(file.path);
  const results = [];
  
  for (const range of ranges) {
    const newPdf = await PDFDocument.create();
    const pages = await newPdf.copyPages(pdf, range);
    pages.forEach(page => newPdf.addPage(page));
    results.push(await newPdf.save());
  }
  
  return results;
}

// Rotate PDF pages
async function rotatePDF(file, rotations) {
  const pdf = await loadPDF(file.path);
  
  rotations.forEach(({ pageIndex, angle }) => {
    const page = pdf.getPage(pageIndex);
    page.setRotation(angle);
  });
  
  return await pdf.save();
}

// Add watermark to PDF
async function addWatermark(file, watermarkText, options = {}) {
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
async function compressPDF(file) {
  const pdf = await loadPDF(file.path);
  return await pdf.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });
}

// Create a ZIP archive from multiple files
async function createZipArchive(filesToZip, outputZipPath) {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputZipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });

    output.on('close', () => {
      console.log(archive.pointer() + ' total bytes');
      console.log('Archiver has been finalized and the output file descriptor has closed.');
      resolve(outputZipPath);
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('Archiver warning:', err);
      } else {
        reject(err);
      }
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    filesToZip.forEach(file => {
      archive.file(file.path, { name: file.name });
    });

    archive.finalize();
  });
}

export {
  mergePDFs,
  splitPDF,
  rotatePDF,
  addWatermark,
  protectPDF,
  compressPDF,
  createZipArchive,
};