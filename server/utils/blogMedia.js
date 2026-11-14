import sharp from 'sharp';
import path from 'node:path';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const blogImageDirectory = process.env.BLOG_MEDIA_DIR || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../uploads/blog-images');
export async function storeBlogImage(buffer) {
  await mkdir(blogImageDirectory, { recursive: true });
  const image = sharp(buffer, { limitInputPixels: 40000000, animated: false });
  const meta = await image.metadata();
  if (!['jpeg', 'png', 'webp'].includes(meta.format)) throw new Error('Choose a JPEG, PNG, or WebP image.');
  const id = randomUUID(), files = [], sizes = {};
  try {
    for (const [suffix, width] of [['hero', 1280], ['card', 480]]) {
      const filename = `${id}-${suffix}.webp`;
      const bytes = await image.clone().rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
      sizes[suffix] = { width: bytes.info.width, height: bytes.info.height };
      const target = path.join(blogImageDirectory, filename); files.push(target);
      await writeFile(target, bytes.data, { flag: 'wx', mode: 0o644 });
    }
    return { url: `/api/blog/images/${id}-hero.webp`, thumbnail: `/api/blog/images/${id}-card.webp`, width: sizes.hero.width, height: sizes.hero.height, thumbnailWidth: sizes.card.width };
  } catch (error) { await Promise.all(files.map(file => unlink(file).catch(() => {}))); throw error; }
}

export const imageReferences = post => [...new Set([post.content, post.coverImage, post.coverThumbnail].flatMap(text => [...String(text || '').matchAll(/\/api\/blog\/images\/([A-Za-z0-9_.-]+)/g)].map(match => match[1])))];
