import { validateUploadedFile, cleanupFiles } from '../utils/fileUtils.js';
import { convertMarkdownContentToDocx, convertMarkdownToDocx } from '../utils/markdownUtils.js';
import { convertFileToPDF, convertImagesToPDF, processFileConversion } from '../utils/pdfConversionUtils.js';
import { createZipArchive } from '../utils/archiveUtils.js';
import { logConversion } from '../utils/statsUtils.js';
import path from 'path';
import fs from 'fs/promises';

const allowedMarkdownMimeTypes = [
  'text/markdown',
  'text/plain',
];

const allowedConversionMimeTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.ms-powerpoint',
  'application/vnd.oasis.opendocument.presentation',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.ms-excel',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'text/markdown',
  'text/plain',
];

const MAX_PASTED_MARKDOWN_BYTES = 2 * 1024 * 1024;

// Controller for /api/convert-md-to-docx
export const convertMdToDocx = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No Markdown file uploaded." });
  }
  try {
    const ok = await validateUploadedFile(req.file.path, req.file.originalname);
    if (!ok) {
      cleanupFiles(req.file.path);
      return res.status(400).json({ error: 'Invalid or unsupported Markdown file.' });
    }
    console.log('📝 Received Markdown file:', req.file.originalname);
    const docxBuffer = await convertMarkdownToDocx(req.file.path);
    console.log('✅ Markdown converted to DOCX successfully');

    // Log conversion
    logConversion({
      toolName: 'markdown-to-docx',
      userId: req.user?._id,
      fileName: req.file.originalname,
      fileSize: docxBuffer.length
    });

    res.setHeader('Content-Disposition', 'attachment; filename="converted-markdown.docx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(docxBuffer);
  } catch (error) {
    console.error('❌ Markdown to DOCX Error:', error.stack);
    res.status(500).json({ error: `Failed to convert Markdown to DOCX: ${error.message}` });
  } finally {
    if (req.file && req.file.path) {
      cleanupFiles(req.file.path);
    }
  }
};

export const convertMarkdownTextToDocx = async (req, res) => {
  const markdown = typeof req.body?.markdown === 'string' ? req.body.markdown : '';
  const filename = typeof req.body?.filename === 'string' && req.body.filename.trim()
    ? req.body.filename.trim()
    : 'pasted-markdown';

  if (!markdown.trim()) {
    return res.status(400).json({ error: 'Paste Markdown text before converting.' });
  }

  if (Buffer.byteLength(markdown, 'utf8') > MAX_PASTED_MARKDOWN_BYTES) {
    return res.status(413).json({ error: 'Pasted Markdown is too large. Please keep it under 2 MB.' });
  }

  try {
    const safeBaseName = filename
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9-_ ]+/g, '')
      .trim()
      .slice(0, 80) || 'pasted-markdown';

    const docxBuffer = await convertMarkdownContentToDocx(markdown, safeBaseName);

    logConversion({
      toolName: 'markdown-to-docx',
      userId: req.user?._id,
      fileName: `${safeBaseName}.md`,
      fileSize: docxBuffer.length
    });

    res.setHeader('Content-Disposition', `attachment; filename="${safeBaseName}.docx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(docxBuffer);
  } catch (error) {
    console.error('❌ Markdown text to DOCX Error:', error.stack);
    res.status(500).json({ error: `Failed to convert Markdown to DOCX: ${error.message}` });
  }
};

// Controller for /api/batch-convert
export const batchConvert = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded for batch conversion." });
  }
  
  const tempFiles = [];
  try {
    const files = req.files;

    // Validate signatures for all uploaded files
    for (const f of files) {
      const ok = await validateUploadedFile(f.path, f.originalname, allowedConversionMimeTypes);
      if (!ok) {
        cleanupFiles(req.files.map(file => file.path));
        return res.status(400).json({ error: `Invalid or unsupported file in upload: ${f.originalname}` });
      }
    }

    // Check if all files are images
    const areAllImages = files.every((file) => {
      const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
      return ["png", "jpg", "jpeg"].includes(ext);
    });

    if (areAllImages) {
      // Combine all images into a single PDF
      const pdfBuffer = await convertImagesToPDF(files.map((file) => file.path));
      
      // Log conversion
      logConversion({
        toolName: 'images-to-pdf',
        userId: req.user?._id,
        fileName: 'combined_images.pdf',
        fileSize: pdfBuffer.length
      });

      res.setHeader("Content-Disposition", 'attachment; filename="combined_images.pdf"');
      res.setHeader("Content-Type", "application/pdf");
      res.send(pdfBuffer);
      console.log("✅ Combined Images to PDF");
    } else {
      // Process files individually and ZIP them
      const convertedFiles = [];
      const uploadsDir = path.join('server', 'uploads'); // Ensure correct path
      // Actually, 'uploads' relative to project root is fine if server is run from root
      // But server usually runs from /server
      
      for (const file of files) {
        const extension = path.extname(file.originalname).toLowerCase().replace(".", "");
        const pdfBuffer = await convertFileToPDF(file.path, extension);
        
        const outputFilename = file.originalname.replace(/\.[^/.]+$/, "") + ".pdf";
        const outputPath = path.join('uploads', `temp_${Date.now()}_${outputFilename}`);
        
        await fs.writeFile(outputPath, pdfBuffer);
        convertedFiles.push({ path: outputPath, name: outputFilename });
        tempFiles.push(outputPath);
        
        console.log(`✅ Converted ${file.originalname} to PDF`);
      }

      if (convertedFiles.length === 1) {
        const pdfBuffer = await fs.readFile(convertedFiles[0].path);
        
        // Log conversion
        logConversion({
          toolName: 'file-to-pdf',
          userId: req.user?._id,
          fileName: convertedFiles[0].name,
          fileSize: pdfBuffer.length
        });

        res.setHeader("Content-Disposition", `attachment; filename="${convertedFiles[0].name}"`);
        res.setHeader("Content-Type", "application/pdf");
        res.send(pdfBuffer);
      } else {
        const zipPath = path.join('uploads', `converted_files_${Date.now()}.zip`);
        await createZipArchive(convertedFiles, zipPath);
        
        // Log conversion
        logConversion({
          toolName: 'batch-to-pdf',
          userId: req.user?._id,
          fileName: 'converted_files.zip'
        });

        res.download(zipPath, 'converted_files.zip', async (err) => {
          if (err) console.error('Error sending ZIP:', err);
          await fs.unlink(zipPath).catch(e => console.error('Error unlinking ZIP:', e));
          for (const f of tempFiles) {
            await fs.unlink(f).catch(e => console.error('Error unlinking temp file:', e));
          }
        });
        return; // Exit to avoid finally block cleaning up files too early
      }
    }

  } catch (error) {
    console.error("Batch Conversion Error:", error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: `Batch conversion failed: ${error.message}` });
    }
  } finally {
    if (req.files) {
      cleanupFiles(req.files.map(file => file.path));
    }
    // Note: tempFiles cleanup is handled in res.download callback for ZIP case
    // For other cases, we should clean them up if they weren't downloaded
    if (!res.headersSent) {
      for (const f of tempFiles) {
        await fs.unlink(f).catch(() => {});
      }
    }
  }
};

// Controller for /api/files/upload
export const uploadFiles = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded." });
  }

  try {
    // Validate each uploaded file's signature
    for (const f of req.files) {
      const ok = await validateUploadedFile(f.path, f.originalname);
      if (!ok) {
        cleanupFiles(req.files.map(file => file.path));
        return res.status(400).json({ error: `Invalid or unsupported file in upload: ${f.originalname}` });
      }
    }

    const convertedResults = await processFileConversion(req.files);

    res.json(convertedResults);

  } catch (error) {
    console.error("Error in /api/files/upload:", error);
    res.status(500).json({ error: error.toString() });
  }
};
