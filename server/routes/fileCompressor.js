import express from 'express';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { upload } from '../middleware/upload.js';
import { cleanupFiles, validateUploadedFile } from '../utils/fileUtils.js';
import { logConversion } from '../utils/statsUtils.js';
import * as pdfOperations from '../controllers/pdfOperations.js';

const router = express.Router();
const imageTypes = ['jpg', 'jpeg', 'png', 'webp'];
const imageMimeTypes = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

function setCompressionHeaders(res, originalSize, outputSize) {
  res.set({
    'X-Original-Size': String(originalSize),
    'X-Compressed-Size': String(outputSize),
    'X-Compression-Reduced': String(outputSize < originalSize),
  });
}

function safeDownloadName(name, ext) {
  const base = path.basename(name, path.extname(name)).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100) || 'compressed';
  return `${base}-compressed.${ext}`;
}

const logCompressionFailure = (req, toolName, reason) => logConversion({
  toolName, userId: req.user?._id,
  analyticsAllowed: req.cookies?.mct_analytics_consent === 'accepted',
  status: 'failure', reason,
});

router.post('/image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) { await logCompressionFailure(req, 'image-compress', 'invalid file'); return res.status(400).json({ error: 'Choose a JPEG, PNG, or WebP image.' }); }
    const valid = await validateUploadedFile(req.file.path, req.file.originalname, imageTypes);
    if (!valid) { await logCompressionFailure(req, 'image-compress', 'invalid file'); return res.status(400).json({ error: 'The uploaded file is not a supported JPEG, PNG, or WebP image.' }); }

    const preset = req.body.preset || 'balanced';
    const qualities = { smaller: 62, balanced: 78, quality: 90 };
    if (!Object.hasOwn(qualities, preset)) { await logCompressionFailure(req, 'image-compress', 'invalid input'); return res.status(400).json({ error: 'Choose a valid image quality preset.' }); }
    const requestedFormat = req.body.format || 'original';
    const inputFormat = path.extname(req.file.originalname).slice(1).toLowerCase();
    const outputFormat = requestedFormat === 'original' ? (inputFormat === 'jpg' ? 'jpeg' : inputFormat) : requestedFormat;
    if (!Object.hasOwn(imageMimeTypes, outputFormat)) { await logCompressionFailure(req, 'image-compress', 'invalid input'); return res.status(400).json({ error: 'Choose JPEG, PNG, or WebP as the output format.' }); }

    const requestedWidth = req.body.width ? Number(req.body.width) : undefined;
    if (requestedWidth !== undefined && (!Number.isInteger(requestedWidth) || requestedWidth < 100 || requestedWidth > 8000)) {
      await logCompressionFailure(req, 'image-compress', 'invalid input');
      return res.status(400).json({ error: 'Resize width must be a whole number from 100 to 8000 pixels.' });
    }

    let pipeline = sharp(req.file.path, { limitInputPixels: 100_000_000 }).rotate();
    if (requestedWidth) pipeline = pipeline.resize({ width: requestedWidth, withoutEnlargement: true });
    if (outputFormat === 'jpeg') pipeline = pipeline.jpeg({ quality: qualities[preset], mozjpeg: true, progressive: true });
    if (outputFormat === 'png') pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true, palette: preset === 'smaller' });
    if (outputFormat === 'webp') pipeline = pipeline.webp({ quality: qualities[preset], effort: 5, smartSubsample: true });

    let output = await pipeline.toBuffer();
    let finalFormat = outputFormat;
    // If the user kept the original format and encoding would increase the size, return the original bytes.
    if (requestedFormat === 'original' && !requestedWidth && output.length >= req.file.size) {
      output = await readFile(req.file.path);
      finalFormat = inputFormat === 'jpg' ? 'jpeg' : inputFormat;
    }

    const ext = finalFormat === 'jpeg' ? 'jpg' : finalFormat;
    setCompressionHeaders(res, req.file.size, output.length);
    res.type(imageMimeTypes[finalFormat]);
    res.set('Content-Disposition', `attachment; filename="${safeDownloadName(req.file.originalname, ext)}"`);
    await logConversion({ toolName: 'image-compress', userId: req.user?._id, analyticsAllowed: req.cookies?.mct_analytics_consent === 'accepted' });
    res.send(output);
  } catch (error) {
    console.error('Image compression error:', error);
    await logConversion({ toolName: 'image-compress', userId: req.user?._id, analyticsAllowed: req.cookies?.mct_analytics_consent === 'accepted', status: 'failure', reason: error.message });
    res.status(error.statusCode || 400).json({ error: error.statusCode ? error.message : 'This image could not be compressed. Check that it is a valid JPEG, PNG, or WebP file.' });
  } finally {
    if (req.file) cleanupFiles(req.file.path);
  }
});

router.post('/pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) { await logCompressionFailure(req, 'pdf-compress', 'invalid file'); return res.status(400).json({ error: 'Choose a PDF file to compress.' }); }
    const valid = await validateUploadedFile(req.file.path, req.file.originalname, ['pdf']);
    if (!valid) { await logCompressionFailure(req, 'pdf-compress', 'invalid file'); return res.status(400).json({ error: 'The uploaded file is not a valid PDF.' }); }
    const output = await pdfOperations.compressPDF(req.file, req.body.preset || 'balanced');
    setCompressionHeaders(res, req.file.size, output.length);
    res.type('application/pdf');
    res.set('Content-Disposition', `attachment; filename="${safeDownloadName(req.file.originalname, 'pdf')}"`);
    await logConversion({ toolName: 'pdf-compress', userId: req.user?._id, analyticsAllowed: req.cookies?.mct_analytics_consent === 'accepted' });
    res.send(Buffer.from(output));
  } catch (error) {
    console.error('PDF compression error:', error);
    await logConversion({ toolName: 'pdf-compress', userId: req.user?._id, analyticsAllowed: req.cookies?.mct_analytics_consent === 'accepted', status: 'failure', reason: error.message });
    res.status(error.statusCode || 400).json({ error: error.statusCode ? error.message : 'This PDF could not be compressed. It may be encrypted or unsupported.' });
  } finally {
    if (req.file) cleanupFiles(req.file.path);
  }
});

export default router;
