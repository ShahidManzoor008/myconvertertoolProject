import path from 'node:path';
import os from 'node:os';
import { promises as fs } from 'node:fs';
import { createZipArchive } from '../utils/archiveUtils.js';
import { fileTypeFromBuffer } from 'file-type';
import { downloadPublicFile, MAX_DOWNLOAD_BYTES } from '../utils/safeDownload.js';

const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/zip',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);

export const safeArchiveName = name => typeof name === 'string' && name.length > 0 && name.length <= 180 &&
  !/[\\/\x00-\x1f\x7f:]/.test(name) && name !== '.' && name !== '..' && !name.startsWith('.');

export const downloadBatch = async (req, res) => {
  const files = req.body?.files;
  if (!Array.isArray(files) || !files.length || files.length > 5 ||
      files.some(f => !f || !safeArchiveName(f.filename) || typeof f.url !== 'string')) {
    return res.status(400).json({ error: 'Provide 1–5 files with valid filenames and URLs' });
  }
  let directory;
  try {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), 'converter-batch-'));
    const entries = [];
    let total = 0;
    for (const file of files) {
      let buffer;
      if (file.url.startsWith('data:')) {
        const match = /^data:[^;,]+;base64,([A-Za-z0-9+/]*={0,2})$/.exec(file.url);
        if (!match || match[1].length > Math.ceil(MAX_DOWNLOAD_BYTES / 3) * 4) throw new Error('Invalid or oversized file data');
        buffer = Buffer.from(match[1], 'base64');
      } else {
        buffer = await downloadPublicFile(file.url);
      }
      total += buffer.length;
      if (total > MAX_DOWNLOAD_BYTES) throw new Error('Batch exceeds 20 MB limit');
      const type = await fileTypeFromBuffer(buffer);
      if (!type || !allowedTypes.has(type.mime)) throw new Error('Unsupported file type');
      // Files stay in memory until archiving; client filenames are archive labels only.
      entries.push({ path: buffer, name: file.filename });
    }
    const archive = path.join(directory, 'processed_files.zip');
    await createZipArchive(entries, archive);
    // Wait for completion or client disconnect before deleting this request's files.
    await new Promise((resolve, reject) => {
      res.once('close', resolve);
      res.download(archive, 'processed_files.zip', error => error ? reject(error) : resolve());
    });
  } catch (error) {
    console.error('Batch download failed:', error.message);
    if (!res.headersSent && !res.destroyed) res.status(400).json({ error: 'Batch download failed. Check file types, size, and allowed URLs.' });
  } finally {
    if (directory) await fs.rm(directory, { recursive: true, force: true }).catch(error => console.error('Batch cleanup failed:', error.message));
  }
};
