import fetch from 'node-fetch';
import path from 'path';
import { promises as fs } from 'fs';
import { createZipArchive } from '../utils/archiveUtils.js';
import { cleanupFiles } from '../utils/fileUtils.js';
import * as fileType from 'file-type';

// Whitelist of allowed domains for fetching files
const ALLOWED_DOWNLOAD_DOMAINS = process.env.ALLOWED_DOWNLOAD_DOMAINS ?
  process.env.ALLOWED_DOWNLOAD_DOMAINS.split(',').map(d => d.trim()) :
  []; // e.g., ['example.com', 'another.org']

// Helper to validate URLs to prevent SSRF
const isValidUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    // Only allow http and https protocols
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return false;
    }

    // Block private IP ranges (e.g., 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.1)
    // This is a simplified check and might need a more robust library for production
    const hostname = parsedUrl.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return false;
    if (hostname.startsWith('10.') || hostname.startsWith('192.168.')) return false;
    if (hostname.startsWith('172.') && parseInt(hostname.split('.')[1], 10) >= 16 && parseInt(hostname.split('.')[1], 10) <= 31) return false;

    // If a whitelist is configured, check against it
    if (ALLOWED_DOWNLOAD_DOMAINS.length > 0) {
      return ALLOWED_DOWNLOAD_DOMAINS.includes(hostname);
    }

    return true;
  } catch (e) {
    return false;
  }
};

// Allowed MIME types for downloaded files (example, adjust as needed)
const allowedDownloadMimeTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/zip',
  'text/plain',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const downloadBatch = async (req, res) => {
  const { files } = req.body;

  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: 'No files provided' });
  }

  const tempFilesToZip = [];
  const tempDir = path.join('uploads', 'batch_temp');
  await fs.mkdir(tempDir, { recursive: true });

  try {
    for (const file of files) {
      let fileBuffer;
      let detectedMimeType = null;

      if (file.url.startsWith('data:')) {
        const base64Data = file.url.split(',')[1];
        fileBuffer = Buffer.from(base64Data, 'base64');
        const type = await fileType.fromBuffer(fileBuffer);
        if (type) detectedMimeType = type.mime;
      } else {
        // Validate URL before fetching
        if (!isValidUrl(file.url)) {
          console.warn(`Attempted to download from invalid URL: ${file.url}`);
          // Skip this file and continue, or return an error for the whole batch
          continue; // For now, skip invalid URLs
        }
        const response = await fetch(file.url);
        if (!response.ok) {
          console.warn(`Failed to fetch ${file.url}: ${response.statusText}`);
          continue; // Skip this file if fetch fails
        }
        fileBuffer = await response.buffer();
        const type = await fileType.fromBuffer(fileBuffer);
        if (type) detectedMimeType = type.mime;
      }

      // Validate detected MIME type
      if (!detectedMimeType || !allowedDownloadMimeTypes.includes(detectedMimeType)) {
        console.warn(`Rejected downloaded file ${file.filename} with unsupported MIME type: ${detectedMimeType}`);
        continue; // Skip unsupported file types
      }

      const tempFilePath = path.join(tempDir, file.filename);
      await fs.writeFile(tempFilePath, fileBuffer);
      tempFilesToZip.push({ path: tempFilePath, name: file.filename });
    }

    if (tempFilesToZip.length === 0) {
      return res.status(400).json({ error: 'No valid files to download or process.' });
    }

    const zipPath = path.join('uploads', 'processed_files.zip');
    await createZipArchive(tempFilesToZip, zipPath);

    res.download(zipPath, 'processed_files.zip', async (err) => {
      if (err) {
        console.error('Error sending zip file:', err);
      }
      // Clean up the created zip file and temporary files
      await fs.unlink(zipPath);
      cleanupFiles(tempFilesToZip.map(f => f.path));
      await fs.rm(tempDir, { recursive: true, force: true });
    });

  } catch (error) {
    console.error('Error creating batch download:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to create batch download' });
    }
  } finally {
    // Ensure cleanup even if download fails or is aborted
    cleanupFiles(tempFilesToZip.map(f => f.path));
    await fs.rm(tempDir, { recursive: true, force: true });
  }
};
