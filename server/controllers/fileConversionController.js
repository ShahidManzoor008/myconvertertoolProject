import { validateUploadedFile, cleanupFiles } from '../utils/fileUtils.js';
import { convertMarkdownToDocx } from '../utils/markdownUtils.js';
import { convertFileToPDF, convertImagesToPDF, processFileConversion } from '../utils/pdfConversionUtils.js';
import path from 'path';
import fs from 'fs';

const allowedMarkdownMimeTypes = [
  'text/markdown',
  'text/plain',
];

const allowedConversionMimeTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.ms-powerpoint',
  'application/vnd.oasis.opendocument.presentation',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.ms-excel',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'text/markdown',
  'text/plain',
];

// Controller for /api/convert-md-to-docx
export const convertMdToDocx = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No Markdown file uploaded." });
  }
  try {
    const ok = await validateUploadedFile(req.file.path, allowedMarkdownMimeTypes);
    if (!ok) {
      cleanupFiles(req.file.path);
      return res.status(400).json({ error: 'Invalid or unsupported Markdown file.' });
    }
    console.log('📝 Received Markdown file:', req.file.originalname);
    const docxBuffer = await convertMarkdownToDocx(req.file.path);
    console.log('✅ Markdown converted to DOCX successfully');

    res.setHeader('Content-Disposition', 'attachment; filename="converted-markdown.docx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(docxBuffer);
  } catch (error) {
    console.error('❌ Markdown to DOCX Error:', error.stack);
    res.status(500).json({ error: `Failed to convert Markdown to DOCX: ${error.message}` });
  } finally {
    cleanupFiles(req.file.path);
  }
};

// Controller for /api/batch-convert
export const batchConvert = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded for batch conversion." });
  }
  try {
    const files = req.files;

    // Validate signatures for all uploaded files
    for (const f of files) {
      const ok = await validateUploadedFile(f.path, allowedConversionMimeTypes);
      if (!ok) {
        cleanupFiles(req.files.map(file => file.path));
        return res.status(400).json({ error: `Invalid or unsupported file in upload: ${f.originalname}` });
      }
    }

    // Check if all files are images
    const areAllImages = files.every((file) => {
      const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
      return ["png", "jpg", "jpeg"].includes(ext);
    });

    if (areAllImages) {
      // Combine all images into a single PDF
      const pdfBuffer = await convertImagesToPDF(files.map((file) => file.path));
      res.setHeader("Content-Disposition", 'attachment; filename="combined_images.pdf"');
      res.setHeader("Content-Type", "application/pdf");
      res.send(pdfBuffer);
      console.log("✅ Combined Images to PDF");
    } else {
      // Process files individually (existing logic)
      const results = [];
      for (const file of files) {
        const extension = path.extname(file.originalname).toLowerCase().replace(".", "");
        const pdfBuffer = await convertFileToPDF(file.path, extension);
        results.push({
          filename: file.originalname.replace(/\.[^/.]+$/, "") + ".pdf",
          base64: Buffer.from(pdfBuffer).toString("base64"),
        });
        console.log(`✅ Converted ${file.originalname} to PDF`);
      }
      res.json(results);
    }

  } catch (error) {
    console.error("Batch Conversion Error:", error.message);
    res.status(500).json({ error: `Batch conversion failed: ${error.message}` });
  } finally {
    if (req.files) {
      cleanupFiles(req.files.map(file => file.path));
    }
  }
};

// Controller for /api/files/upload
export const uploadFiles = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded." });
  }

  try {
    // Validate each uploaded file's signature
    for (const f of req.files) {
      const ok = await validateUploadedFile(f.path, allowedConversionMimeTypes);
      if (!ok) {
        cleanupFiles(req.files.map(file => file.path));
        return res.status(400).json({ error: `Invalid or unsupported file in upload: ${f.originalname}` });
      }
    }

    const convertedResults = await processFileConversion(req.files); // This now returns an array of { filename, base64 }

    res.json(convertedResults); // Send the array of converted files as JSON

  } catch (error) {
    console.error("Error in /api/files/upload:", error);
    res.status(500).json({ error: error.toString() });
  } finally {
    // The original uploaded files are cleaned up in processFileConversion.
    // Any other temp files created by convertFileToPDF are cleaned up within that function.
  }
};