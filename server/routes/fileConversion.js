import express from 'express';
import { upload } from '../middleware/upload.js';
import { convertMdToDocx, batchConvert, uploadFiles } from '../controllers/fileConversionController.js';

const router = express.Router();

// API: Convert Markdown to DOCX
router.post('/md-to-docx', upload.single('file'), convertMdToDocx);

// API: Batch Conversion for Multiple Files
router.post("/batch", upload.array("files", 5), batchConvert);

// API: File Upload (General Conversion)
router.post("/upload", upload.array("files"), uploadFiles);

export default router;
