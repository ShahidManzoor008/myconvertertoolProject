import { validationResult } from 'express-validator';

const ALLOWED_MIME_TYPES = {
  documents: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ],
  images: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
};

const FILE_SIZE_LIMITS = {
  document: 10 * 1024 * 1024, // 10 MB for documents
  image: 5 * 1024 * 1024,     // 5 MB for images
};

export const validateFileUpload = (options = {}) => {
  const {
    allowedTypes = [...ALLOWED_MIME_TYPES.documents, ...ALLOWED_MIME_TYPES.images],
    maxFileSize = FILE_SIZE_LIMITS.document,
    required = true
  } = options;

  return (req, res, next) => {
    const files = req.files || (req.file ? [req.file] : []);

    if (required && files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded!' });
    }

    for (const file of files) {
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          error: `Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`
        });
      }

      if (file.size > maxFileSize) {
        return res.status(400).json({
          error: `File size exceeds the limit of ${maxFileSize / (1024 * 1024)} MB`
        });
      }
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    next();
  };
};

export const validateRequestBody = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const validateQueryParams = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
