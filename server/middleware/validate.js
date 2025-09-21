const { validationResult } = require("express-validator");

const validateFileUpload = (req, res, next) => {
  const allowedMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ];
  const maxFileSize = 5 * 1024 * 1024; // 5 MB

  const files = req.files || (req.file ? [req.file] : []);

  if (files.length === 0) {
    return res.status(400).json({ error: "No files uploaded!" });
  }

  for (const file of files) {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({
        error: `Invalid file type: ${file.mimetype}. Only PDF, images, and DOCX are allowed.`,
      });
    }
    if (file.size > maxFileSize) {
      return res.status(400).json({
        error: `File size exceeds the limit of ${
          maxFileSize / (1024 * 1024)
        } MB.`,
      });
    }
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  next();
};

module.exports = { validateFileUpload };
