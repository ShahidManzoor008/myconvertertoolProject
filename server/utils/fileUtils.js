import fs from 'fs';
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
    const fileTypeModule = await import('file-type');
    const type = await fileTypeModule.fileTypeFromFile(filePath);

    // For file types that file-type may not recognize (like plain text), we can add a fallback.
    if (!type) {
      const ext = path.extname(originalName).toLowerCase().substring(1);
      if (['md', 'txt'].includes(ext)) {
        console.log(`✅ Allowed fallback for extension: ${ext}`);
        return true;
      }
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
