import archiver from 'archiver';
import { createWriteStream } from 'fs';

// Create a ZIP archive from multiple files
export async function createZipArchive(filesToZip, outputZipPath) {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputZipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });

    output.on('close', () => {
      console.log(archive.pointer() + ' total bytes');
      console.log('Archiver has been finalized and the output file descriptor has closed.');
      resolve(outputZipPath);
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('Archiver warning:', err);
      } else {
        reject(err);
      }
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    filesToZip.forEach(file => {
      archive.file(file.path, { name: file.name });
    });

    archive.finalize();
  });
}
