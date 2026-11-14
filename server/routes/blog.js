import express from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { readdir, stat, unlink } from 'node:fs/promises';
import { getAllPosts, getPostBySlug, createPost, updatePost, deletePost, previewPost, publishedFilter, withBlogWrite } from '../controllers/blogController.js';
import { adminAuth, optionalAuth } from '../middleware/auth.js';
import Blog from '../models/Blog.js';
import { storeBlogImage, blogImageDirectory } from '../utils/blogMedia.js';

const router = express.Router();
const legacyPublicImages = new Set(['blog1.webp', 'blog2.webp', 'blog3.webp', 'blog4.webp', 'dev-tools-image.jpg', 'pdf-tools-image.jpg', 'text-case-image.jpg']);
const asAdmin = (req, _res, next) => { req.blogAdmin = true; next(); };
router.get('/posts', getAllPosts);
router.get('/categories', async (_req, res, next) => {
  try { res.json(await Blog.aggregate([{ $match: publishedFilter }, { $group: { _id: { $ifNull: ['$category', 'Guides'] }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }])); } catch (error) { next(error); }
});
router.get('/posts/:slug', getPostBySlug);
router.get('/manage/posts', adminAuth, asAdmin, getAllPosts);
router.get('/manage/posts/:slug', adminAuth, asAdmin, getPostBySlug);
router.post('/preview', adminAuth, rateLimit({ windowMs: 60000, limit: 30, message: { message: 'Preview is updating too often. Wait a moment and try again.' }, skip: () => process.env.NODE_ENV === 'test' }), previewPost);
router.post('/posts', adminAuth, createPost);
router.put('/posts/:slug', adminAuth, updatePost);
router.delete('/posts/:slug', adminAuth, deletePost);
let uploading = false;
const imageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1, fields: 2 } });
router.post('/images', adminAuth, (req, res, next) => {
  if (uploading) return res.status(429).json({ message: 'An image is being processed. Try again shortly.' });
  uploading = true; const release = () => { uploading = false; };
  req.releaseBlogImageSlot = release;
  res.once('finish', () => { if (!req.blogImageProcessing) release(); });
  res.once('close', () => { if (!req.blogImageProcessing) release(); }); next();
}, imageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Choose one image, up to 8 MB.' });
    req.blogImageProcessing = true;
    res.status(201).json(await storeBlogImage(req.file.buffer));
  } catch { res.status(400).json({ message: 'Choose a JPEG, PNG, or WebP image under 8 MB and 40 megapixels.' }); }
  finally { req.blogImageProcessing = false; req.releaseBlogImageSlot(); }
});
router.get('/images/:filename', optionalAuth, async (req, res, next) => {
  res.set('Cache-Control', 'private, no-store');
  try {
    const filename = req.params.filename;
    if (!/^[A-Za-z0-9_.-]+$/.test(filename) || filename.startsWith('.')) return res.sendStatus(404);
    const url = `/api/blog/images/${filename}`;
    const publicUse = legacyPublicImages.has(filename) || await Blog.exists({ $and: [publishedFilter, { $or: [{ imageFiles: filename }, { coverImage: url }, { coverThumbnail: url }, { imageFiles: { $exists: false }, content: { $regex: filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') } }] }] });
    if (!publicUse && req.user?.role !== 'admin') return res.sendStatus(404);
    res.set('Cache-Control', publicUse ? 'public, max-age=2592000, immutable' : 'private, no-store');
    res.sendFile(filename, { root: blogImageDirectory, dotfiles: 'deny' }, error => { if (error) next(error); });
  } catch (error) { next(error); }
});
const unusedImages = async () => {
  const references = new Set();
  for await (const post of Blog.find().select('content coverImage coverThumbnail').lean().cursor()) {
    for (const text of [post.content, post.coverImage, post.coverThumbnail]) {
      for (const match of String(text || '').matchAll(/\/api\/blog\/images\/([A-Za-z0-9_.-]+)/g)) references.add(match[1]);
    }
  }
  const candidates = [];
  for (const filename of await readdir(blogImageDirectory)) {
    if (!/^[a-f0-9-]{36}-(hero|card)\.webp$/.test(filename) || references.has(filename)) continue;
    const info = await stat(path.join(blogImageDirectory, filename));
    if (Date.now() - info.mtimeMs > 7 * 86400000) candidates.push({ filename, bytes: info.size });
  }
  return candidates;
};
router.get('/media/unused', adminAuth, async (_req, res, next) => {
  try { res.json({ images: await unusedImages(), graceDays: 7 }); } catch (error) { next(error); }
});
router.post('/media/cleanup', adminAuth, (req, res, next) => withBlogWrite(async () => {
  try {
    if (req.body.confirm !== true) return res.status(400).json({ message: 'Confirm image cleanup first.' });
    const candidates = await unusedImages();
    for (const image of candidates) await unlink(path.join(blogImageDirectory, image.filename));
    res.json({ removed: candidates.length, bytes: candidates.reduce((sum, image) => sum + image.bytes, 0) });
  } catch (error) { next(error); }
}));
export default router;
