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
export const validateUploadedFile = async (filePath, originalName, allowedExtensions = null) => {
  try {
    const fileTypeModule = await import('file-type');
    const type = await fileTypeModule.fileTypeFromFile(filePath);

    const ext = path.extname(originalName).toLowerCase().substring(1);

    // Fallback for file types that file-type may not recognize (like plain text/markdown)
    if (!type) {
      if (['md', 'txt'].includes(ext)) {
        if (allowedExtensions && !allowedExtensions.includes(ext)) {
          console.warn(`❌ Fallback extension ${ext} not in allowed list`);
          return false;
        }
        console.log(`✅ Allowed fallback for extension: ${ext}`);
        return true;
      }
      console.warn(`⚠️ Could not determine file type for ${originalName}`);
      return false;
    }

    const defaultAllowed = new Set([
      'pdf', 'docx', 'pptx', 'xlsx', 'doc', 'ppt', 'odp', 'ods', 'odt', 'xls',
      'jpeg', 'png', 'jpg', 'md', 'txt', 'webp', 'gif', 'bmp'
    ]);

    const detectedExt = type.ext;

    // If custom allowed list provided, check against it
    if (allowedExtensions) {
      // Normalize allowedExtensions (handle mime types or extensions)
      const normalizedAllowed = allowedExtensions.map(e => e.includes('/') ? e.split('/')[1] : e.replace('.', ''));
      if (!normalizedAllowed.includes(detectedExt)) {
        console.error(`❌ Uploaded file ${originalName} has disallowed signature: ${detectedExt}`);
        return false;
      }
    } else if (!defaultAllowed.has(detectedExt)) {
      console.error(`❌ Uploaded file ${originalName} has disallowed signature: ${detectedExt}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error validating uploaded file:', err);
    return false;
  }
};
