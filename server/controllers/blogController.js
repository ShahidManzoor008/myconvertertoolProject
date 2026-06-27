import Blog from '../models/Blog.js';
import slugify from 'slugify';
import { validationResult } from 'express-validator';
import { cleanupFiles, validateUploadedFile } from '../utils/fileUtils.js';

const allowedImageMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp'
];

// Get all blog posts
export const getAllPosts = async (req, res) => {
  console.log('Fetching all blog posts...');
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Blog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('title excerpt author coverImage readingTime createdAt slug');

    const total = await Blog.countDocuments();

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single blog post by slug
export const getPostBySlug = async (req, res) => {
  try {
    const normalizedSlug = slugify(req.params.slug, { lower: true, strict: true }); // Normalize the incoming slug
    const post = await Blog.findOne({ slug: normalizedSlug }); // Use the normalized slug
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new blog post
export const createPost = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.file) cleanupFiles(req.file.path);
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { title, content, excerpt, author, tags } = req.body;
    let coverImage = null;

    if (req.file) {
      const isValidImage = await validateUploadedFile(req.file.path, req.file.originalname, allowedImageMimeTypes);
      if (!isValidImage) {
        cleanupFiles(req.file.path);
        return res.status(400).json({ message: 'Invalid cover image file type.' });
      }
      coverImage = `/api/blog/images/${req.file.filename}`;
    }

    const slug = slugify(title, { lower: true, strict: true });

    const post = new Blog({
      title,
      content,
      excerpt,
      author,
      tags,
      coverImage,
      slug
    });

    const savedPost = await post.save();
    res.status(201).json(savedPost);
  } catch (error) {
    if (req.file) cleanupFiles(req.file.path);
    res.status(400).json({ message: error.message });
  }
};

// Update blog post
export const updatePost = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.file) cleanupFiles(req.file.path);
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { title, content, excerpt, tags } = req.body;
    const updates = {
      title,
      content,
      excerpt,
      tags
    };

    if (req.file) {
      const isValidImage = await validateUploadedFile(req.file.path, req.file.originalname, allowedImageMimeTypes);
      if (!isValidImage) {
        cleanupFiles(req.file.path);
        return res.status(400).json({ message: 'Invalid cover image file type.' });
      }
      updates.coverImage = `/api/blog/images/${req.file.filename}`;
    }

    if (title) {
      updates.slug = slugify(title, { lower: true, strict: true });
    }

    const post = await Blog.findOneAndUpdate(
      { slug: req.params.slug },
      updates,
      { new: true, runValidators: true }
    );

    if (!post) {
      if (req.file) cleanupFiles(req.file.path);
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    if (req.file) cleanupFiles(req.file.path);
    res.status(400).json({ message: error.message });
  }
};

// Delete blog post
export const deletePost = async (req, res) => {
  try {
    const post = await Blog.findOneAndDelete({ slug: req.params.slug });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};