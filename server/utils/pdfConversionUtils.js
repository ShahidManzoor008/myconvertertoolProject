import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { cleanupFiles } from './fileUtils.js';
import puppeteer from 'puppeteer';
import markdownit from 'markdown-it';

// Helper Function: Convert Image(s) to PDF
export const convertImagesToPDF = async (imagePaths) => {
  const pdfDoc = await PDFDocument.create();
  const imagePathsArray = Array.isArray(imagePaths) ? imagePaths : [imagePaths];

  for (const imagePath of imagePathsArray) {
    const imageBytes = fs.readFileSync(imagePath);
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

// Helper Function: Convert Text to PDF (with Markdown styling)
const convertTextToPDF = async (filePath) => {
  const extension = path.extname(filePath).toLowerCase();
  let htmlContent;

  // Read file and convert Markdown to HTML if applicable
  const fileContent = await fs.promises.readFile(filePath, 'utf-8');
  if (extension === '.md') {
    const md = markdownit();
    htmlContent = md.render(fileContent);
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
  const cssPath = path.resolve(path.dirname(filePath), '..', 'assets', 'markdown-styles.css');
  const cssContent = await fs.promises.readFile(cssPath, 'utf-8');

  // Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Set the HTML content with embedded styles
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>${cssContent}</style>
    </head>
    <body class="markdown-body">
      ${htmlContent}
    </body>
    </html>
  `, { waitUntil: 'networkidle0' });

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

  await browser.close();
  return pdfBuffer;
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

if (!fs.existsSync(libreOfficePath)) {
  console.error(`❌ LibreOffice executable not found at: ${libreOfficePath}`);
  console.error("Please ensure LibreOffice is installed and its path is correctly configured in .env or is in a standard location.");
  process.exit(1); // Stop execution if the executable is missing
} else {
  console.log("✅ LibreOffice Path:", libreOfficePath);
}

// Convert a single file to PDF using LibreOffice
const convertToPDF = (inputPath) => {
  return new Promise((resolve, reject) => {
    const outputDir = path.dirname(inputPath);
    const baseName = path.basename(inputPath, path.extname(inputPath));
    
    const toPdfCommand = `"${libreOfficePath}" --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`;

    exec(toPdfCommand, (pdfError, pdfStdout, pdfStderr) => {
      if (pdfError) {
        console.error("❌ LibreOffice to PDF Conversion Error:", pdfStderr);
        return reject("LibreOffice failed to convert the file to PDF.");
      }

      console.log("📄 LibreOffice to PDF Output:", pdfStdout);

      const pdfFile = `${baseName}.pdf`;
      const generatedPdfPath = path.join(outputDir, pdfFile);

      if (!fs.existsSync(generatedPdfPath)) {
        console.error("❌ PDF file was not created.");
        return reject("Conversion failed: No PDF output file.");
      }

      console.log(`✅ PDF Successfully Created: ${generatedPdfPath}`);
      resolve(generatedPdfPath);
    });
  });
};

// Helper Function: Convert Files to PDF for Batch Mode
export const convertFileToPDF = async (filePath, fileType) => {
  const supportedImageTypes = ["png", "jpg", "jpeg"];
  const supportedTextTypes = ["md", "txt"];
  const supportedLibreOfficeTypes = ["docx", "pptx", "xlsx", "odt", "ods", "odp"];

  if (supportedImageTypes.includes(fileType)) {
    // convertImagesToPDF expects an array, so wrap filePath in an array
    return await convertImagesToPDF([filePath]);
  } else if (supportedTextTypes.includes(fileType)) {
    return await convertTextToPDF(filePath);
  } else if (supportedLibreOfficeTypes.includes(fileType)) {
    const pdfPath = await convertToPDF(filePath);
    const pdfBuffer = fs.readFileSync(pdfPath);
    await fs.promises.unlink(pdfPath); // Clean up the temporary PDF generated by LibreOffice asynchronously
    return pdfBuffer;
  } else {
    throw new Error(`Unsupported file type for batch conversion: ${fileType}`);
  }
};

// Process conversion for one or more files
export const processFileConversion = async (files) => {
  const convertedResults = [];
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
    }
  }

  // Cleanup original uploaded files
  cleanupFiles(files.map(file => file.path));

  return convertedResults;
};