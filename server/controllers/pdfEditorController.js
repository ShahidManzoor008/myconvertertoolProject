import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import { cleanupFiles, validateUploadedFile } from '../utils/fileUtils.js';
import { addTextToPdf, removeTextFromPdf } from '../utils/pdfEditorUtils.js';

const allowedPdfMimeTypes = [
  'application/pdf',
];

export const editPdf = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF file uploaded." });
  }

  try {
    const ok = await validateUploadedFile(req.file.path, allowedPdfMimeTypes);
    if (!ok) {
      cleanupFiles(req.file.path);
      return res.status(400).json({ error: 'Invalid or unsupported PDF file.' });
    }
    const pdfBytes = await fs.readFile(req.file.path);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const { edits } = req.body; // Expecting an array of edit operations

    for (const edit of edits) {
      const page = pdfDoc.getPages()[edit.pageIndex];
      if (!page) continue;

      if (edit.type === 'addText') {
        await addTextToPdf(pdfDoc, page, edit.text, edit.x, edit.y, edit.size, null, edit.color);
      } else if (edit.type === 'removeText') {
        removeTextFromPdf(page, edit.x, edit.y, edit.width, edit.height);
      }
    }

    const modifiedPdfBytes = await pdfDoc.save();
    cleanupFiles(req.file.path);

    res.setHeader('Content-Disposition', 'attachment; filename="edited.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(modifiedPdfBytes));

  } catch (error) {
    console.error('❌ PDF Editor Error:', error.stack);
    res.status(500).json({ error: `Failed to edit PDF: ${error.message}` });
  } finally {
    cleanupFiles(req.file.path);
  }
};