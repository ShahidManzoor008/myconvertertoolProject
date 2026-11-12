import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { execFile } from 'child_process';
import { cleanupFiles } from './fileUtils.js';
import puppeteer from 'puppeteer';
import { renderMarkdownHtml } from './markdownUtils.js';
import { fileURLToPath } from 'node:url';

const execAsync = promisify(execFile);

// Helper Function: Convert Image(s) to PDF
export const convertImagesToPDF = async (imagePaths) => {
  const pdfDoc = await PDFDocument.create();
  const imagePathsArray = Array.isArray(imagePaths) ? imagePaths : [imagePaths];

  for (const imagePath of imagePathsArray) {
    // Use async read instead of readFileSync to avoid blocking the event loop
    const imageBytes = await fs.promises.readFile(imagePath);
    const extension = path.extname(imagePath).toLowerCase();

    const image = extension === ".png"
      ? await pdfDoc.embedPng(imageBytes)
      : await pdfDoc.embedJpg(imageBytes);

    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  return Buffer.from(await pdfDoc.save());
};

let renderingText = false;

// Helper Function: Convert Text to PDF (with Markdown styling)
const convertTextToPDF = async (filePath, fileType) => {
  const extension = path.extname(filePath).toLowerCase();
  let htmlContent;

  // Read file and convert Markdown to HTML if applicable
  const fileContent = await fs.promises.readFile(filePath, 'utf-8');
  if (['md', 'markdown'].includes(fileType || extension.slice(1))) {
    htmlContent = await renderMarkdownHtml(fileContent);
  } else {
    // For plain text, wrap in <pre> for basic formatting
    htmlContent = `<pre>${fileContent.replace(/[&<>"']/g, (match) => {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[match];
    })}</pre>`;
  }

  // Read the GitHub Markdown CSS
  const cssPath = fileURLToPath(new URL('../assets/markdown-styles.css', import.meta.url));
  const cssContent = await fs.promises.readFile(cssPath, 'utf-8');

  // Retain the renderer lock through browser cleanup, including disconnected requests.
  if (renderingText) throw new Error('Text converter is busy');
  renderingText = true;
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      timeout: 60000,
      protocolTimeout: 60000,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (/^(data:|about:blank$)/.test(request.url())) request.continue();
      else request.abort();
    });

    // Set the HTML content with embedded styles
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <style>${cssContent}
          .markdown-body pre { white-space: pre-wrap; overflow-wrap: anywhere; }
          .markdown-body pre code { white-space: pre-wrap; }
          .markdown-body table { display: table; table-layout: fixed; }
          .markdown-body td, .markdown-body th { overflow-wrap: anywhere; }
          .markdown-body img { max-width: 100%; object-fit: contain; }
          .markdown-body h1, .markdown-body h2, .markdown-body h3 { break-after: avoid; }
        </style>
      </head>
      <body class="markdown-body">
        ${htmlContent}
      </body>
      </html>
    `, { waitUntil: 'load', timeout: 60000 });

    await page.evaluate(async () => {
      await Promise.all(Array.from(document.images, image => image.decode()));
      await document.fonts.ready;
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });

    return pdfBuffer;
  } finally {
    try { if (browser) await browser.close(); } finally { renderingText = false; }
  }
};


// PDF Conversion Functions with libreoffice
const getLibreOfficePath = () => {
  if (process.env.LIBREOFFICE_PATH) {
    return process.env.LIBREOFFICE_PATH;
  }

  // Platform-specific default paths
  switch (process.platform) {
    case "win32": // Windows
      return "C:\\Program Files\\LibreOffice\\program\\soffice.exe";
    case "darwin": // macOS
      return "/Applications/LibreOffice.app/Contents/MacOS/soffice";
    case "linux":
    default:
      return "/usr/bin/soffice";
  }
};

const libreOfficePath = getLibreOfficePath();

// Check LibreOffice availability asynchronously without crashing the server.
// Missing LibreOffice will be reported per-conversion instead of killing the process.
fs.promises.access(libreOfficePath)
  .then(() => console.log("✅ LibreOffice Path:", libreOfficePath))
  .catch(() => {
    console.warn(`⚠️ LibreOffice executable not found at: ${libreOfficePath}`);
    console.warn("LibreOffice-based conversions will fail until this is fixed. PDF/Image/Text conversions still work.");
  });

// Convert a single file to PDF using LibreOffice
const convertToPDF = async (inputPath) => {
  const outputDir = path.dirname(inputPath);
  const baseName = path.basename(inputPath, path.extname(inputPath));

  const conversionArgs = ['--headless', '--convert-to', 'pdf', '--outdir', outputDir, inputPath];

  try {
    const { stdout, stderr } = await execAsync(libreOfficePath, conversionArgs, { timeout: 60000, maxBuffer: 1024 * 1024 });
    console.log("📄 LibreOffice to PDF Output:", stdout);

    if (stderr) {
      console.error("❌ LibreOffice to PDF Conversion Error:", stderr);
    }

    const pdfFile = `${baseName}.pdf`;
    const generatedPdfPath = path.join(outputDir, pdfFile);

    try {
      await fs.promises.access(generatedPdfPath);
    } catch {
      console.error("❌ PDF file was not created.");
      throw new Error("Conversion failed: No PDF output file.");
    }

    console.log(`✅ PDF Successfully Created: ${generatedPdfPath}`);
    return generatedPdfPath;
  } catch (err) {
    console.error("❌ LibreOffice to PDF Conversion Error:", err.message || err);
    throw new Error("LibreOffice failed to convert the file to PDF.");
  }
};

// Helper Function: Convert Files to PDF for Batch Mode
export const convertFileToPDF = async (filePath, fileType) => {
  const supportedImageTypes = ["png", "jpg", "jpeg"];
  const supportedTextTypes = ["md", "markdown", "txt"];
  const supportedLibreOfficeTypes = ["docx", "pptx", "xlsx", "odt", "ods", "odp"];

  if (supportedImageTypes.includes(fileType)) {
    // convertImagesToPDF expects an array, so wrap filePath in an array
    return await convertImagesToPDF([filePath]);
  } else if (supportedTextTypes.includes(fileType)) {
    return await convertTextToPDF(filePath, fileType);
  } else if (fileType === 'pdf') {
    return await fs.promises.readFile(filePath);
  } else if (supportedLibreOfficeTypes.includes(fileType)) {
    const pdfPath = await convertToPDF(filePath);
    const pdfBuffer = await fs.promises.readFile(pdfPath);
    await fs.promises.unlink(pdfPath); // Clean up the temporary PDF generated by LibreOffice asynchronously
    return pdfBuffer;
  } else {
    throw new Error(`Unsupported file type for batch conversion: ${fileType}`);
  }
};

// Process conversion for one or more files
export const processFileConversion = async (files) => {
  const convertedResults = [];
  const failures = [];
  const imageFiles = [];
  const otherFiles = [];

  // Separate image files from other files
  for (const file of files) {
    const extension = path.extname(file.originalname).toLowerCase().replace(".", "");
    const supportedImageTypes = ["png", "jpg", "jpeg"];
    if (supportedImageTypes.includes(extension)) {
      imageFiles.push(file);
    } else {
      otherFiles.push(file);
    }
  }

  // Process image files together
  if (imageFiles.length > 0) {
    try {
      const imagePaths = imageFiles.map(file => file.path);
      const pdfBuffer = await convertImagesToPDF(imagePaths);
      convertedResults.push({
        filename: "converted_images.pdf",
        base64: Buffer.from(pdfBuffer).toString("base64"),
        temp: imagePaths, // Keep original temp paths for cleanup
        convertedTemp: null
      });
    } catch (error) {
      console.error(`❌ Error converting images:`, error);
      failures.push({ filename: "images", error: "Image conversion failed" });
    }
  }

  // Process other files individually
  for (const file of otherFiles) {
    try {
      const extension = path.extname(file.originalname).toLowerCase().replace(".", "");
      const pdfBuffer = await convertFileToPDF(file.path, extension);
      convertedResults.push({
        filename: file.originalname.replace(/\.[^/.]+$/, "") + ".pdf",
        base64: Buffer.from(pdfBuffer).toString("base64"),
        temp: file.path, // Keep original temp path for cleanup
        convertedTemp: null // Will be set if convertFileToPDF returns a path
      });
    } catch (error) {
      console.error(`❌ Error converting ${file.originalname}:`, error);
      failures.push({ filename: file.originalname, error: "File conversion failed" });
    }
  }

  // Cleanup original uploaded files
  cleanupFiles(files.map(file => file.path));

  if (failures.length) {
    const error = new Error("One or more files could not be converted");
    error.conversionFailures = failures;
    throw error;
  }
  return convertedResults;
};