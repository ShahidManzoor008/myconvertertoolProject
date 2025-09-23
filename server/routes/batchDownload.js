import express from 'express';
import { downloadBatch } from '../controllers/batchDownloadController.js';

const router = express.Router();

router.post('/', downloadBatch);

export default router;