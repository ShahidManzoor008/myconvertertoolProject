import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs/promises';
import { cleanupFiles, validateUploadedFile } from '../utils/fileUtils.js';

const allowedPdfMimeTypes = [
  'application/pdf',
];

// Helper function to load PDF and handle errors
const loadPdf = async (filePath, originalName) => {
  const ok = await validateUploadedFile(filePath, originalName, allowedPdfMimeTypes);
  if (!ok) {
    cleanupFiles(filePath);
    throw new Error('Invalid or unsupported PDF file.');
  }
  const pdfBytes = await fs.readFile(filePath);
  return PDFDocument.load(pdfBytes);
};

// Helper function to save and send PDF
const saveAndSendPdf = async (res, pdfDoc, originalFilename) => {
  const modifiedPdfBytes = await pdfDoc.save();
  res.setHeader('Content-Disposition', `attachment; filename="edited_${originalFilename || 'document.pdf'}"`);
  res.setHeader('Content-Type', 'application/pdf');
  res.send(Buffer.from(modifiedPdfBytes));
};

export const addPage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF file uploaded." });
  }
  try {
    const pdfDoc = await loadPdf(req.file.path, req.file.originalname);
    pdfDoc.addPage();
    await saveAndSendPdf(res, pdfDoc, req.file.originalname);
  } catch (error) {
    console.error('❌ Add Page Error:', error.stack);
    res.status(500).json({ error: `Failed to add page: ${error.message}` });
  } finally {
    cleanupFiles(req.file.path);
  }
};

export const deletePage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF file uploaded." });
  }
  try {
    const { pageIndex } = req.body; // Expecting 0-indexed page number
    if (typeof pageIndex === 'undefined' || pageIndex < 0) {
      return res.status(400).json({ error: "Page index is required and must be non-negative." });
    }

    const pdfDoc = await loadPdf(req.file.path, req.file.originalname);
    if (pdfDoc.getPages().length <= 1) {
      return res.status(400).json({ error: "Cannot delete the last page of the PDF." });
    }
    pdfDoc.removePage(pageIndex);
    await saveAndSendPdf(res, pdfDoc, req.file.originalname);
  } catch (error) {
    console.error('❌ Delete Page Error:', error.stack);
    res.status(500).json({ error: `Failed to delete page: ${error.message}` });
  } finally {
    cleanupFiles(req.file.path);
  }
};

export const addText = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF file uploaded." });
  }
  try {
    const { text, pageIndex, x, y, size, color } = req.body;
    if (!text || typeof pageIndex === 'undefined' || pageIndex < 0) {
      return res.status(400).json({ error: "Text, page index, x, y, size, and color are required." });
    }

    const pdfDoc = await loadPdf(req.file.path, req.file.originalname);
    const pages = pdfDoc.getPages();
    const targetPage = pages[pageIndex];

    if (!targetPage) {
      return res.status(400).json({ error: "Page not found." });
    }

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    targetPage.drawText(text, {
      x: x || 50,
      y: y || (targetPage.getHeight() - 50),
      font,
      size: size || 24,
      color: color ? rgb(color.r, color.g, color.b) : rgb(0, 0, 0),
    });

    await saveAndSendPdf(res, pdfDoc, req.file.originalname);
  } catch (error) {
    console.error('❌ Add Text Error:', error.stack);
    res.status(500).json({ error: `Failed to add text: ${error.message}` });
  } finally {
    cleanupFiles(req.file.path);
  }
};

export const savePdf = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF file uploaded." });
  }
  try {
    // For savePdf, we essentially just return the uploaded file as is, or if it was modified
    // by a previous operation in the same session, that modified version.
    // Since each operation already saves and sends, this might be redundant.
    // However, if we want a dedicated 'Save' button that doesn't imply further edits,
    // we can just send the current file.
    const pdfBytes = await fs.readFile(req.file.path);
    res.setHeader('Content-Disposition', `attachment; filename="${req.file.originalname}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('❌ Save PDF Error:', error.stack);
    res.status(500).json({ error: `Failed to save PDF: ${error.message}` });
  } finally {
    cleanupFiles(req.file.path);
  }
};

// Existing editPdf function (can be refactored or removed if specific routes cover all needs)
export const editPdf = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF file uploaded." });
  }

  try {
    const pdfDoc = await loadPdf(req.file.path, req.file.originalname);

    const { edits } = req.body; // Expecting an array of edit operations

    if (edits && edits.length > 0) {
      for (const edit of edits) {
        const page = pdfDoc.getPages()[edit.pageIndex];
        if (!page) continue;

        if (edit.type === 'addText') {
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          page.drawText(edit.text, {
            x: edit.x || 50,
            y: edit.y || (page.getHeight() - 50),
            font,
            size: edit.size || 24,
            color: edit.color ? rgb(edit.color.r, edit.color.g, edit.color.b) : rgb(0, 0, 0),
          });
        } else if (edit.type === 'removeText') {
          // Redaction: Draw an opaque rectangle over the area
          page.drawRectangle({
            x: edit.x || 0,
            y: edit.y || 0,
            width: edit.width || 100,
            height: edit.height || 20,
            color: rgb(1, 1, 1), // White for "removal", or black for redaction
            opacity: 1,
          });
        }
      }
    }

    await saveAndSendPdf(res, pdfDoc, req.file.originalname);

  } catch (error) {
    console.error('❌ PDF Editor Error:', error.stack);
    res.status(500).json({ error: `Failed to edit PDF: ${error.message}` });
  } finally {
    cleanupFiles(req.file.path);
  }
};