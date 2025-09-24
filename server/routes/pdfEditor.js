import express from 'express';
import { 
  addPage, 
  deletePage, 
  addText, 
  savePdf, 
  editPdf // Keep existing for general edit if needed
} from '../controllers/pdfEditorController.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Existing general edit route
router.post('/', upload.single('file'), editPdf);

// New routes for specific PDF editing operations
router.post('/add-page', upload.single('file'), addPage);
router.post('/delete-page', upload.single('file'), deletePage);
router.post('/add-text', upload.single('file'), addText);
router.post('/save-pdf', upload.single('file'), savePdf); // This might be redundant if other operations save and return

export default router;