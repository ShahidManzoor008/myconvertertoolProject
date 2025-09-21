import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
const distPath = path.join(__dirname, '..', 'dist');
const workerSrc = path.join(nodeModulesPath, 'pdfjs-dist', 'build', 'pdf.worker.min.js');
const workerDest = path.join(distPath, 'pdf.worker.min.js');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

// Copy worker file
try {
  fs.copyFileSync(workerSrc, workerDest);
  console.log('✅ PDF.js worker file copied successfully');
} catch (error) {
  console.error('❌ Error copying PDF.js worker file:', error);
  process.exit(1);
}