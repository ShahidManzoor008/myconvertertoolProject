// ============================
// 📂 Server: index.js
// ============================
process.env.LIBREOFFICE_PATH = "\"C:\\Program Files\\LibreOffice\\program\\soffice.exe\"";

const express = require("express");
require("dotenv").config({ path: "./.env" });
const cors = require("cors");
const { validateFileUpload } = require("./middleware/validate");
const helmet = require("helmet");
const multer = require("multer");
const fs = require("fs");
const sizeOf = require("image-size").imageSize;
const path = require("path");
const { exec } = require("child_process");
const archiver = require("archiver");
const XLSX = require("exceljs");
const { PDFDocument, rgb } = require("pdf-lib");
const rateLimit = require("express-rate-limit");
const markdownit = require("markdown-it");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableCell,
  TableRow,
  WidthType,
  HeadingLevel,
} = require("docx");

const app = express();
const port = process.env.PORT || 5000;
// const allowedOrigins =["http://localhost:3000"];
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : ["http://localhost:3000"];
// ============================
// 🛡️ Enable CORS and Security Middleware
// ============================
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);
app.use(helmet());
app.set("trust proxy", 1);
// ============================
// 🛡️ Rate Limiting: 10 requests per minute per IP
// ============================
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per window
  message: { error: "Too many requests, please try again later." },
});
// const limiter = rateLimit({
//   windowMs: 1 * 60 * 1000, // 1 minute
//   max: 10, // Limit each IP to 10 requests per minute
//   message: { error: "Too many requests, please try again later." },
// });
app.use("/api/", limiter);

// ============================
// 🗂️ Configure Multer for File Uploads
// ============================
// Allowed MIME types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",  // ✅ Allow PDF
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/msword",
    "application/vnd.ms-powerpoint",
    "application/vnd.oasis.opendocument.presentation",
    "application/vnd.oasis.opendocument.spreadsheet",
    "application/vnd.oasis.opendocument.text",
    "application/vnd.ms-excel", 
    "image/jpeg",
    "image/png",
    "image/jpg",   // ✅ Allow PNG
    "text/markdown",  // ✅ Allow Markdown (.md)
    "text/plain"  ,     // ✅ Some browsers use "text/plain" for .md files
    "application/octet-stream",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    console.error(`❌ Rejected file type: ${file.mimetype}`);
    return cb(new Error("Invalid file type"), false);
  }
  cb(null, true);
};

const storage = multer.diskStorage({
  destination: "uploads/", //
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // ✅ Keep the correct extension
  },
});

// ✅ Use 'storage' instead of 'dest'
const upload = multer({
  storage,  // ✅ Storage configuration
  fileFilter,
  limits: { fileSize: 75 * 1024 * 1024 }, // ✅ 75MB max file size
});

// ============================
// ✅ File Upload API (Test Route)
// ============================
app.post("/api/test-upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded!" });
  }
  res.json({ message: "File uploaded successfully!", file: req.file });
});
// ============================
// 🛡️ Health Check Endpoint
// ============================
app.get('/health', (req, res) => res.status(200).send('OK'));

// ============================
// 🛡️ JSON Parsing Middleware (AFTER File Upload Routes)
// ============================
app.use(express.json());

// // ============================
// // 📂 Serve Static Files from React App
// // ============================
// app.use(express.static(path.join(__dirname, "dist")));
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "dist", "index.html"));
// });
// ============================
// 🧹 Helper Function: Cleanup Uploaded Files
// ============================
const cleanupFiles = (files) => {
  if (Array.isArray(files)) {
    files.forEach((file) => fs.unlinkSync(file.path));
  } else {
    fs.unlinkSync(files.path);
  }
};

// ============================
// 🖼️ Helper Function: Convert Image (PNG/JPG) to PDF
// ============================
const combineImagesToPDF = async (imagePaths) => {
  const pdfDoc = await PDFDocument.create();

  for (const imagePath of imagePaths) {
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
// ============================
// 🖼️ Helper Function: Convert Image (PNG/JPG) to PDF
// ============================
const convertImageToPDF = async (filePath) => {
  const imageBytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);

  const extension = path.extname(filePath).toLowerCase();
  const image =
    extension === ".png"
      ? await pdfDoc.embedPng(imageBytes)
      : await pdfDoc.embedJpg(imageBytes);

  page.drawImage(image, {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  });

  return Buffer.from(await pdfDoc.save());
};

// ============================
// 🧩 Helper Function: Convert Files to PDF for Batch Mode
// ============================
const convertFileToPDF = async (filePath, fileType) => {
  if (["png", "jpg", "jpeg",].includes(fileType))
    return await convertImageToPDF(filePath);
  if (fileType === "md") return await convertToPDF(filePath);
  throw new Error(`Unsupported file type: ${fileType}`);
};
// ============================
// 📝 Helper Function: Convert Markdown to DOCX 
// ============================
const convertMarkdownToDocx = async (filePath) => {
  const mdContent = fs.readFileSync(filePath, 'utf-8');
  const md = markdownit();
  const htmlContent = md.render(mdContent);
  // Helper: Create Paragraph
  const createParagraph = (text, { bold = false, italic = false, bullet = false, heading = null } = {}) => {
    return new Paragraph({
      children: [new TextRun({ text, bold, italics: italic, size: 24 })],
      bullet: bullet ? { level: 0 } : undefined,
      heading,
      spacing: { after: 200 },
    });
  };
  // Helper: Create Table from Markdown
  const createTable = (rows) => {
    const tableRows = rows.map((row) => {
      const cells = row.split('|').filter(Boolean).map((cell) => (
        new TableCell({
          children: [new Paragraph(cell.trim())],
          width: { size: 2500, type: WidthType.DXA },
        })
      ));
      return new TableRow({ children: cells });
    });

    return new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    });
  };
  // 📝 Parse Markdown Content
  let tableRows = [];
  const docContent = [];
  // Add Document Title
  docContent.push(
    new Paragraph({
      children: [new TextRun({ text: '📄 MarkdownToDOCX sms-coding.online', bold: true, size: 32 })],
      alignment: "center",
      spacing: { after: 300 },
    })
  );
  // Parse Markdown Content into DOCX
  htmlContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    // Tables
    if (line.startsWith('|') && line.includes('|')) {
      tableRows.push(line);
    } else {
      if (tableRows.length > 0) {
        docContent.push(createTable(tableRows));
        tableRows = [];
      }
      // Headings
      if (trimmed.startsWith('<h1>')) {
        docContent.push(createParagraph(stripHtml(trimmed), { bold: true, heading: HeadingLevel.HEADING_1 }));
      } else if (trimmed.startsWith('<h2>')) {
        docContent.push(createParagraph(stripHtml(trimmed), { bold: true, heading: HeadingLevel.HEADING_2 }));
      } else if (trimmed.startsWith('<h3>')) {
        docContent.push(createParagraph(stripHtml(trimmed), { bold: true, heading: HeadingLevel.HEADING_3 }));
      }
      // Lists
      else if (/^(\*|-)\s+/.test(trimmed)) {
        docContent.push(createParagraph(stripHtml(trimmed.replace(/^(\*|-)\s+/, '')), { bullet: true }));
      }
      // Paragraphs
      else if (trimmed !== '') {
        docContent.push(createParagraph(stripHtml(trimmed)));
      }
      // Blank Line
      else {
        docContent.push(new Paragraph({}));
      }
    }
  });
  // Add Remaining Table if Present
  if (tableRows.length) {
    docContent.push(createTable(tableRows));
  }
  // 📄 Create DOCX with Sections Immediately 
  const doc = new Document({
    creator: "Markdown Converter Tool",
    title: "Markdown to DOCX Document",
    description: "Converted from a Markdown file",
    sections: [
      {
        properties: {},
        children: docContent,
      },
    ],
  });
  // ✅ Generate DOCX Buffer
  return await Packer.toBuffer(doc);
};

// ============================
// Helper: Strip HTML Tags
// ============================
const stripHtml = (str) => str.replace(/<\/?[^>]+(>|$)/g, '');

// ============================
// 📂 API: Convert Markdown to DOCX
// ============================
app.post('/api/convert-md-to-docx', upload.single('file'), async (req, res) => {
  try {
    console.log('📝 Received Markdown file:', req.file.originalname);
    const docxBuffer = await convertMarkdownToDocx(req.file.path);
    cleanupFiles(req.file);
    console.log('✅ Markdown converted to DOCX successfully');

    res.setHeader('Content-Disposition', 'attachment; filename="converted-markdown.docx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(docxBuffer);
  } catch (error) {
    console.error('❌ Markdown to DOCX Error:', error.stack);
    res.status(500).json({ error: `Failed to convert Markdown to DOCX: ${error.message}` });
  }
});

// ============================
// 🧩 API: Batch Conversion for Multiple Files
// ============================
app.post("/api/batch-convert", upload.array("files", 5), validateFileUpload, async (req, res) => {
  try {
    const files = req.files;

    // Check if all files are images
    const areAllImages = files.every((file) => {
      const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
      return ["png", "jpg", "jpeg"].includes(ext);
    });

    if (areAllImages) {
      // Combine all images into a single PDF
      const pdfBuffer = await combineImagesToPDF(files.map((file) => file.path));
      cleanupFiles(files);

      res.setHeader("Content-Disposition", 'attachment; filename="combined_images.pdf"');
      res.setHeader("Content-Type", "application/pdf");
      res.send(pdfBuffer);
      console.log("✅ Combined Images to PDF");
    } else {
      // Process files individually (existing logic)
      const results = [];
      for (const file of files) {
        const extension = path.extname(file.originalname).toLowerCase().replace(".", "");
        const pdfBuffer = await convertFileToPDF(file.path, extension);
        results.push({
          filename: file.originalname.replace(/\.[^/.]+$/, "") + ".pdf",
          base64: Buffer.from(pdfBuffer).toString("base64"),
        });
        console.log(`✅ Converted ${file.originalname} to PDF`);
      }
      cleanupFiles(files);
      console.log("✅ Batch Conversion Completed file cleanup");
      res.json(results);
    }
  } catch (error) {
    console.error("Batch Conversion Error:", error.message);
    res.status(500).json({ error: `Batch conversion failed: ${error.message}` });
  }
});

// -----------------------------------------
// PDF Conversion Functions with libreoffice
// -----------------------------------------
const libreOfficePath = process.env.LIBREOFFICE_PATH || "/usr/bin/soffice";
if (!libreOfficePath) {
  console.error("❌ LIBREOFFICE_PATH is not set in .env file");
  process.exit(1); // Stop execution if the variable is missing
}else{
  console.log("✅ LibreOffice Path:", libreOfficePath);
}
// Convert a single file to PDF using LibreOffice
const convertToPDF = (inputPath) => {
  return new Promise((resolve, reject) => {
    const outputDir = path.dirname(inputPath);
    const command = `${libreOfficePath} --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("❌ LibreOffice Conversion Error:", stderr);
        return reject("LibreOffice failed to convert the file.");
      }

      console.log("📄 LibreOffice Output:", stdout);

      // Find the generated PDF file in the output directory
      const files = fs.readdirSync(outputDir);
      const pdfFile = files.find(
        (file) =>
          file.endsWith(".pdf") &&
          file.includes(path.basename(inputPath, path.extname(inputPath)))
      );

      if (!pdfFile) {
        console.error("❌ PDF file was not created.");
        return reject("Conversion failed: No output file.");
      }

      const generatedPdfPath = path.join(outputDir, pdfFile);
      console.log(`✅ PDF Successfully Created: ${generatedPdfPath}`);

      if (!fs.existsSync(generatedPdfPath)) {
        return reject("File conversion failed: PDF file not found.");
      }

      resolve(generatedPdfPath);
    });
  });
};

// Process conversion for one or more files
const processFileConversion = async (files) => {
  const convertedFiles = [];

  for (const file of files) {
    try {
      const pdfPath = await convertToPDF(file.path);
      convertedFiles.push({
        original: file.originalname,
        converted: pdfPath,
        temp: file.path,
      });
    } catch (error) {
      console.error(`❌ Error converting ${file.originalname}:`, error);
    }
  }

  // If a single file is uploaded, return it directly
  if (convertedFiles.length === 1) {
    return {
      type: "single",
      filePath: path.resolve(convertedFiles[0].converted),
      tempFiles: [convertedFiles[0].temp, convertedFiles[0].converted],
    };
  }

  // If multiple files, create a ZIP archive
  const zipPath = path.resolve(`uploads/converted_${Date.now()}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip");

  return new Promise((resolve, reject) => {
    output.on("close", () => {
      console.log("✅ ZIP Created:", zipPath);
      resolve({
        type: "zip",
        filePath: zipPath,
        tempFiles: [
          ...convertedFiles.map((f) => f.temp),
          ...convertedFiles.map((f) => f.converted),
          zipPath,
        ],
      });
    });

    archive.on("error", (err) => {
      console.error("❌ ZIP Error:", err);
      reject(err);
    });

    archive.pipe(output);
    convertedFiles.forEach(({ original, converted }) => {
      const zipFileName = original.replace(/\.[^/.]+$/, "_converted.pdf");
      archive.file(converted, { name: zipFileName });
    });

    archive.finalize();
  });
};

// Cleanup temporary files after download
const cleanupFilesLibre = (files) => {
  files.forEach((file) => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`🗑️ Deleted temp file: ${file}`);
    }
  });
};

// -------------------------
// API Endpoint
// -------------------------
app.post("/api/files/upload", upload.array("files"), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded." });
    }

    const result = await processFileConversion(req.files);
    res.download(result.filePath, (err) => {
      if (err) {
        console.error("Download error:", err);
      }
      cleanupFilesLibre(result.tempFiles);
    });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

// ============================
// 🚀 Start Backend Server
// ============================
app.listen(port, () => {
  console.log(`API running on port:${port}`);
});
