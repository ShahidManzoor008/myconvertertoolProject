import express from 'express';
import archiver from 'archiver';
import fetch from 'node-fetch';

const router = express.Router();

router.post('/download-batch', async (req, res) => {
  const { files } = req.body;

  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: 'No files provided' });
  }

  // Create a zip archive
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });

  // Set the appropriate headers
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename=processed_files.zip`);

  // Pipe archive data to response
  archive.pipe(res);

  try {
    // Download each file and add it to the archive
    for (const file of files) {
      let fileBuffer;

      if (file.url.startsWith('data:')) {
        // Handle base64 data URLs
        const base64Data = file.url.split(',')[1];
        fileBuffer = Buffer.from(base64Data, 'base64');
      } else {
        // Handle blob URLs by fetching them
        const response = await fetch(file.url);
        fileBuffer = await response.buffer();
      }

      archive.append(fileBuffer, { name: file.filename });
    }

    // Finalize the archive
    await archive.finalize();
  } catch (error) {
    console.error('Error creating batch download:', error);
    // If we haven't started sending the response yet
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to create batch download' });
    } else {
      // If we've already started sending the response, we need to destroy it
      res.destroy();
    }
  }
});

export default router;