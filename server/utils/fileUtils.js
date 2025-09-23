import fs from 'fs';
import * as fileType from 'file-type';
import path from 'path';

// Helper function: Cleanup Uploaded Files
export const cleanupFiles = (files) => {
  const filesToClean = Array.isArray(files) ? files : [files];
  filesToClean.forEach((file) => {
    const filePath = typeof file === 'string' ? file : file.path;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted temp file: ${filePath}`);
    }
  });
};

// Helper: Validate uploaded file by inspecting magic numbers
export const validateUploadedFile = async (filePath, originalName) => {
  try {
    // Read a reasonable chunk from the file (first 4KB) for detection
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(4100);
    const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, 0);
    fs.closeSync(fd);

    const slice = buffer.slice(0, bytesRead);
    const type = await fileType.fromBuffer(slice);

    if (!type) {
      console.warn(`⚠️ Could not determine file type for ${originalName}`);
      return false;
    }

    const allowed = new Set([
      'pdf', 'docx', 'pptx', 'xlsx', 'doc', 'ppt', 'odp', 'ods', 'odt', 'xls',
      'jpeg', 'png', 'jpg', 'md', 'txt'
    ]);

    // fileType.ext gives the detected extension (without dot)
    if (!allowed.has(type.ext)) {
      console.error(`❌ Uploaded file ${originalName} has disallowed signature: ${type.ext}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error validating uploaded file:', err);
    return false;
  }
};
