import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import * as pdfOperations from '../controllers/pdfOperations.js';
import { upload } from '../middleware/upload.js';
import { createZipArchive } from '../utils/archiveUtils.js';
import { logConversion } from '../utils/statsUtils.js';
import { validateUploadedFile, cleanupFiles } from '../utils/fileUtils.js';

const router = express.Router();
const allowedPdfExtensions = ['pdf'];

// Middleware to validate PDF files
const validatePdf = async (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);
  if (files.length === 0) return next();

  try {
    for (const file of files) {
      const ok = await validateUploadedFile(file.path, file.originalname, allowedPdfExtensions);
      if (!ok) {
        cleanupFiles(files);
        return res.status(400).json({ error: `Invalid PDF file: ${file.originalname}` });
      }
    }
    next();
  } catch (error) {
    cleanupFiles(files);
    res.status(500).json({ error: 'File validation failed' });
  }
};

// Helper function to send file response
async function sendFileResponse(res, pdfBuffer, originalFilename, toolName, userId) {
  const sanitizedFilename = path.basename(originalFilename).replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Log conversion
  logConversion({
    toolName,
    userId,
    fileName: sanitizedFilename,
    fileSize: pdfBuffer.length
  });

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${sanitizedFilename}"`,
  });
  res.send(Buffer.from(pdfBuffer));
}

// Merge PDFs
router.post('/merge', upload.array('files'), validatePdf, async (req, res) => {
  try {
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({ error: 'At least two files are required for merge' });
    }
    const mergedPdf = await pdfOperations.mergePDFs(req.files);
    await sendFileResponse(res, mergedPdf, 'merged.pdf', 'pdf-merge', req.user?._id);
  } catch (error) {
    console.error('Merge PDFs error:', error);
    res.status(500).json({ error: 'Failed to merge PDFs' });
  } finally {
    // Cleanup uploaded files
    if (req.files) await Promise.all(req.files.map(file => fs.unlink(file.path)));
  }
});

// Split PDF
router.post('/split', upload.single('file'), validatePdf, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File is required' });
    let ranges;
    try {
      ranges = JSON.parse(req.body.ranges);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid ranges' });
    }
    const splitPdfs = await pdfOperations.splitPDF(req.file, ranges);
    
    if (splitPdfs.length === 1) {
      await sendFileResponse(res, splitPdfs[0], 'split.pdf', 'pdf-split', req.user?._id);
    } else {
      const zipPath = path.join('uploads', 'split_pdfs.zip');
      const filesToZip = splitPdfs.map((pdf, i) => ({
        path: pdf,
        name: `split_${i + 1}.pdf`
      }));
      await createZipArchive(filesToZip, zipPath);
      
      // Log conversion
      logConversion({
        toolName: 'pdf-split',
        userId: req.user?._id,
        fileName: 'split_pdfs.zip'
      });

      res.download(zipPath, 'split_pdfs.zip', async () => {
        await fs.unlink(zipPath);
      });
    }
  } catch (error) {
    console.error('Split PDF error:', error);
    res.status(500).json({ error: 'Failed to split PDF' });
  } finally {
    if (req.file) await fs.unlink(req.file.path);
  }
});

// Rotate PDF pages
router.post('/rotate', upload.single('file'), validatePdf, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File is required' });
    let rotations;
    try {
      rotations = JSON.parse(req.body.rotations);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid rotations' });
    }
    const rotatedPdf = await pdfOperations.rotatePDF(req.file, rotations);
    await sendFileResponse(res, rotatedPdf, 'rotated.pdf', 'pdf-rotate', req.user?._id);
  } catch (error) {
    console.error('Rotate PDF error:', error);
    res.status(500).json({ error: 'Failed to rotate PDF pages' });
  } finally {
    if (req.file) await fs.unlink(req.file.path);
  }
});

// Reorder PDF pages
router.post('/reorder', upload.single('file'), validatePdf, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File is required' });
    let order;
    try {
      order = JSON.parse(req.body.order);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid order' });
    }
    const reorderedPdf = await pdfOperations.reorderPDF(req.file, order);
    await sendFileResponse(res, reorderedPdf, 'reordered.pdf', 'pdf-reorder', req.user?._id);
  } catch (error) {
    console.error('Reorder PDF error:', error);
    res.status(500).json({ error: 'Failed to reorder PDF pages' });
  } finally {
    if (req.file) await fs.unlink(req.file.path);
  }
});

// Extract images from PDF
router.post('/extract-images', upload.single('file'), validatePdf, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File is required' });
    const images = await pdfOperations.extractImages(req.file);
    const zipPath = path.join('uploads', 'extracted_images.zip');
    await createZipArchive(images, zipPath);
    
    // Log conversion
    logConversion({
      toolName: 'pdf-extract-images',
      userId: req.user?._id,
      fileName: 'extracted_images.zip'
    });

    res.download(zipPath, 'extracted_images.zip', async () => {
      await fs.unlink(zipPath);
      await Promise.all(images.map(image => fs.unlink(image.path)));
    });
  } catch (error) {
    console.error('Extract images error:', error);
    res.status(500).json({ error: 'Failed to extract images from PDF' });
  } finally {
    if (req.file) await fs.unlink(req.file.path);
  }
});

// Add watermark
router.post('/watermark', upload.single('file'), validatePdf, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File is required' });
    const { watermarkText, options } = req.body;
    const parsedOptions = options ? JSON.parse(options) : {};
    const watermarkedPdf = await pdfOperations.addWatermark(
      req.file,
      watermarkText,
      parsedOptions
    );
    await sendFileResponse(res, watermarkedPdf, 'watermarked.pdf', 'pdf-watermark', req.user?._id);
  } catch (error) {
    console.error('Add watermark error:', error);
    res.status(500).json({ error: 'Failed to add watermark' });
  } finally {
    if (req.file) await fs.unlink(req.file.path);
  }
});

// Protect PDF
router.post('/protect', upload.single('file'), validatePdf, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File is required' });
    const { password } = req.body;
    const protectedPdf = await pdfOperations.protectPDF(req.file, password);
    await sendFileResponse(res, protectedPdf, 'protected.pdf', 'pdf-protect', req.user?._id);
  } catch (error) {
    console.error('Protect PDF error:', error);
    const status = error.statusCode || 500;
    const message = status === 501 ? error.message : 'Failed to protect PDF';
    res.status(status).json({ error: message });
  } finally {
    if (req.file) await fs.unlink(req.file.path);
  }
});

// Compress PDF
router.post('/compress', upload.single('file'), validatePdf, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File is required' });
    const compressedPdf = await pdfOperations.compressPDF(req.file);
    await sendFileResponse(res, compressedPdf, 'compressed.pdf', 'pdf-compress', req.user?._id);
  } catch (error) {
    console.error('Compress PDF error:', error);
    res.status(500).json({ error: 'Failed to compress PDF' });
  } finally {
    if (req.file) await fs.unlink(req.file.path);
  }
});

export default router;