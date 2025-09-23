import express from 'express';
import {
  getAllPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost
} from '../controllers/blogController.js';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/posts', getAllPosts);
router.get('/posts/:slug', getPostBySlug);

// Protected routes - require authentication
router.post(
  '/posts',
  auth,
  upload.single('coverImage'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('author').notEmpty().withMessage('Author is required'),
  ],
  createPost
);
router.put(
  '/posts/:slug',
  auth,
  upload.single('coverImage'),
  [
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('content').optional().notEmpty().withMessage('Content cannot be empty'),
    body('author').optional().notEmpty().withMessage('Author cannot be empty'),
  ],
  updatePost
);
router.delete('/posts/:slug', auth, deletePost);

export default router;