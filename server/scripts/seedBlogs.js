// Add missing guides only. Existing editorial changes are never overwritten.
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Blog from '../models/Blog.js';
import { storeBlogImage, blogImageDirectory, imageReferences } from '../utils/blogMedia.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(root, 'server/.env'), quiet: true });
const entries = JSON.parse(await readFile(path.join(root, 'content/blog/manifest.json'), 'utf8'));
await mongoose.connect(process.env.MONGODB_URI);
try {
  for (const entry of entries) {
    if (await Blog.exists({ slug: entry.slug })) { console.log(`Kept existing article: ${entry.slug}`); continue; }
    const content = await readFile(path.join(root, `content/blog/${entry.slug}.md`), 'utf8');
    const image = await storeBlogImage(await readFile(path.join(blogImageDirectory, entry.sourceImage)));
    const post = { title: entry.title, slug: entry.slug, excerpt: entry.excerpt, content, contentFormat: 'markdown', status: 'published', publishedAt: new Date(), author: 'MyConverterTool Team', authorType: 'Organization', category: entry.category, tags: entry.tags, coverAlt: entry.coverAlt, coverImage: image.url, coverThumbnail: image.thumbnail, coverWidth: image.width, coverHeight: image.height, coverThumbnailWidth: image.thumbnailWidth, editorialRevision: '2026-11-markdown-v1', revision: 1 };
    await Blog.create({ ...post, imageFiles: imageReferences(post) });
    console.log(`Created article: ${entry.slug}`);
  }
} finally { await mongoose.disconnect(); }
