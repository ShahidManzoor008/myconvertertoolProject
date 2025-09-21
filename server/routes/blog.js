import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getAllPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost
} from '../controllers/blogController.js';
import { auth } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Public routes
router.get('/posts', getAllPosts);
router.get('/posts/:slug', getPostBySlug);

// Protected routes - require authentication
router.post('/posts', auth, upload.single('coverImage'), createPost);
router.put('/posts/:slug', auth, upload.single('coverImage'), updatePost);
router.delete('/posts/:slug', auth, deletePost);

// Serve uploaded images
router.get('/images/:filename', (req, res) => {
  const { filename } = req.params;
  res.sendFile(path.join(__dirname, '../uploads/blog-images', filename));
});

export default router;