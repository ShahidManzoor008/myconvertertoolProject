import express from 'express';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import * as pdfOperations from '../controllers/pdfOperations.js';

const router = express.Router();

// Helper to sanitize filenames
const sanitizeFilename = (filename) => {
  return path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
};

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB per file
});
// Moved imports to the top

// Helper function to send file response
async function sendFileResponse(res, pdfBuffer, originalFilename) {
  const sanitizedFilename = sanitizeFilename(originalFilename);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${sanitizedFilename}"`,
  });
  res.send(Buffer.from(pdfBuffer));
}

// Merge PDFs
router.post('/merge', upload.array('files'), async (req, res) => {
  try {
    const mergedPdf = await pdfOperations.mergePDFs(req.files);
    await sendFileResponse(res, mergedPdf, 'merged.pdf');
  } catch (error) {
    res.status(500).json({ error: 'Failed to merge PDFs' });
  } finally {
    // Cleanup uploaded files
    await Promise.all(req.files.map(file => fs.unlink(file.path)));
  }
});

// Split PDF
router.post('/split', upload.single('file'), async (req, res) => {
  try {
    const ranges = JSON.parse(req.body.ranges);
    const splitPdfs = await pdfOperations.splitPDF(req.file, ranges);
    
    if (splitPdfs.length === 1) {
      await sendFileResponse(res, splitPdfs[0], 'split.pdf');
    } else {
      // TODO: Implement ZIP file creation for multiple PDFs
      res.status(501).json({ error: 'Multiple file download not implemented' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to split PDF' });
  } finally {
    if (req.file) await fs.unlink(req.file.path);
  }
});

// Rotate PDF pages
router.post('/rotate', upload.single('file'), async (req, res) => {
  try {
    const rotations = JSON.parse(req.body.rotations);
    const rotatedPdf = await pdfOperations.rotatePDF(req.file, rotations);
    await sendFileResponse(res, rotatedPdf, 'rotated.pdf');
  } catch (error) {
    res.status(500).json({ error: 'Failed to rotate PDF pages' });
  } finally {
    if (req.file) await fs.unlink(req.file.path);
  }
});

// Add watermark
router.post('/watermark', upload.single('file'), async (req, res) => {
  try {
    const { watermarkText, options } = req.body;
    const watermarkedPdf = await pdfOperations.addWatermark(
      req.file,
      watermarkText,
      JSON.parse(options)
    );
    await sendFileResponse(res, watermarkedPdf, 'watermarked.pdf');
  } catch (error) {
    res.status(500).json({ error: 'Failed to add watermark' });
  } finally {
    if (req.file) await fs.unlink(req.file.path);
  }
});

// Protect PDF
router.post('/protect', upload.single('file'), async (req, res) => {
  try {
    const { password } = req.body;
    const protectedPdf = await pdfOperations.protectPDF(req.file, password);
    await sendFileResponse(res, protectedPdf, 'protected.pdf');
  } catch (error) {
    res.status(500).json({ error: 'Failed to protect PDF' });
  } finally {
    if (req.file) await fs.unlink(req.file.path);
  }
});

// Compress PDF
router.post('/compress', upload.single('file'), async (req, res) => {
  try {
    const compressedPdf = await pdfOperations.compressPDF(req.file);
    await sendFileResponse(res, compressedPdf, 'compressed.pdf');
  } catch (error) {
    res.status(500).json({ error: 'Failed to compress PDF' });
  } finally {
    if (req.file) await fs.unlink(req.file.path);
  }
});

export default router;