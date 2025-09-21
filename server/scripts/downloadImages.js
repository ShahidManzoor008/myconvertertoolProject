import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const images = [
  {
    name: 'pdf-tools-image.jpg',
    url: 'https://images.unsplash.com/photo-1618077360395-f951d3feb30d?w=800&auto=format&fit=crop'
  },
  {
    name: 'dev-tools-image.jpg',
    url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&auto=format&fit=crop'
  },
  {
    name: 'text-case-image.jpg',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop'
  }
];

async function downloadImage(url, filepath) {
  const response = await fetch(url);
  const buffer = await response.buffer();
  await fs.writeFile(filepath, buffer);
  console.log(`Downloaded: ${filepath}`);
}

async function downloadAllImages() {
  const uploadDir = path.join(__dirname, '../uploads/blog-images');
  
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  for (const image of images) {
    const filepath = path.join(uploadDir, image.name);
    await downloadImage(image.url, filepath);
  }
}

// Run the download
downloadAllImages().catch(console.error);