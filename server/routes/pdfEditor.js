import express from 'express';
import { editPdf } from '../controllers/pdfEditorController.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/', upload.single('file'), editPdf);

export default router;