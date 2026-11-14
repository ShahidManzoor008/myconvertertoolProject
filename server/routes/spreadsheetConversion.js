import express from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { fileTypeFromFile } from 'file-type';
import mongoose from 'mongoose';
import { logConversion } from '../utils/statsUtils.js';
import logger from '../utils/logger.js';
import { convertSpreadsheet, SpreadsheetError, spreadsheetOptions } from '../utils/spreadsheetConversion.js';

const uploadDirectory = path.join(os.tmpdir(), 'myconvertertool-uploads');
mkdirSync(uploadDirectory, { recursive: true });
const upload = multer({ dest: uploadDirectory, limits: { fileSize: 20 * 1024 * 1024, files: 1, fields: 4, parts: 5 } });
const router = express.Router();

for (const mode of ['excel-to-pdf', 'pdf-to-excel']) {
  router.post(`/${mode}`, (req, res) => {
    upload.single('file')(req, res, async uploadError => {
      try {
        if (uploadError) throw new SpreadsheetError(uploadError.code === 'LIMIT_FILE_SIZE' ? 'File exceeds the 20 MB upload limit.' : 'Upload one file with the supported options.', 400);
        if (!req.file) throw new SpreadsheetError('Choose a file to convert.', 400);
        const extension = path.extname(req.file.originalname).slice(1).toLowerCase();
        const allowed = mode === 'excel-to-pdf' ? ['xlsx', 'xls'] : ['pdf'];
        if (!allowed.includes(extension)) throw new SpreadsheetError(`Upload a ${allowed.join(' or ')} file.`, 400);
        const type = await fileTypeFromFile(req.file.path);
        if (extension === 'xlsx' && ['xls', 'cfb'].includes(type?.ext)) {
          throw new SpreadsheetError('This workbook may be password-protected. Upload an unlocked XLSX copy.');
        }
        // Legacy XLS uses the shared OLE Compound File Binary container.
        if (!type || (extension === 'xls' ? !['xls', 'cfb'].includes(type.ext) : type.ext !== extension)) {
          throw new SpreadsheetError('The file contents do not match its extension.', 400);
        }
        const result = await convertSpreadsheet(mode, req.file.path, extension, spreadsheetOptions(mode, req.body));
        if (mongoose.connection.readyState === 1) {
          void logConversion({ toolName: mode, userId: req.user?._id,
            analyticsAllowed: req.cookies?.mct_analytics_consent === 'accepted' });
        }
        const outputExtension = mode === 'excel-to-pdf' ? 'pdf' : 'xlsx';
        const filename = `${path.basename(req.file.originalname, path.extname(req.file.originalname)).replace(/[^a-zA-Z0-9_ -]/g, '').slice(0, 80) || 'converted'}.${outputExtension}`;
        res.json({ filename, mimeType: outputExtension === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          base64: result.buffer.toString('base64'), preview: result.preview, warnings: result.warnings });
      } catch (error) {
        await logConversion({ toolName: mode, userId: req.user?._id,
          analyticsAllowed: req.cookies?.mct_analytics_consent === 'accepted', status: 'failure', reason: error.message });
        if (!error.status || error.status >= 422) {
          logger.warn({ mode, reason: error.message }, 'Spreadsheet conversion failed');
        }
        res.status(error.status || 500).json({ error: error.status ? error.message : 'Spreadsheet conversion failed. Try another file.' });
      } finally {
        if (req.file) await fs.unlink(req.file.path).catch(() => {});
      }
    });
  });
}

export default router;
