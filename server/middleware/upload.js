import multer from 'multer';
import AppError from '../utils/AppError.js';
import { randomUUID } from 'node:crypto';
import path from 'path';
import * as fileType from 'file-type';
import fs from 'fs';

// Allowed MIME types
const fileFilter = async (req, file, cb) => {
  const allowedMimeTypes = [
    "application/pdf",
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
    "image/jpg",
    "image/webp",
    "image/gif",
    "image/bmp",
    "text/markdown",
    "text/plain",
    "application/octet-stream", // Generic binary data, might need further inspection
  ];

  const allowedExtensions = [
    "pdf", "docx", "pptx", "xlsx", "doc", "ppt", "odp", "ods", "odt", "xls",
    "jpeg", "png", "jpg", "webp", "gif", "bmp", "md", "markdown", "txt"
  ];

  const extension = path.extname(file.originalname).slice(1).toLowerCase();
  if (!allowedExtensions.includes(extension) || !allowedMimeTypes.includes(file.mimetype)) {
    console.error(`❌ Rejected file type: ${file.mimetype}`);
    return cb(new AppError("Invalid file type", 400), false);
  }
  cb(null, true);
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine destination based on file fieldname
    if (file.fieldname === 'coverImage') {
      cb(null, 'uploads/blog-images/');
    } else {
      cb(null, 'uploads/');
    }
  },
  filename: (req, file, cb) => {
    cb(null, randomUUID() + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 75 * 1024 * 1024, files: 5, fields: 20, parts: 25 }, // 75MB max file size
  fileFilter
});