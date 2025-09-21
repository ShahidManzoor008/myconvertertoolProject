import Blog from '../models/Blog.js';
import slugify from 'slugify';

// Get all blog posts
export const getAllPosts = async (req, res) => {
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
  try {
    const { title, content, excerpt, author, tags, coverImage } = req.body;
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
    res.status(400).json({ message: error.message });
  }
};

// Update blog post
export const updatePost = async (req, res) => {
  try {
    const { title, content, excerpt, tags, coverImage } = req.body;
    const updates = {
      title,
      content,
      excerpt,
      tags,
      coverImage
    };

    if (title) {
      updates.slug = slugify(title, { lower: true, strict: true });
    }

    const post = await Blog.findOneAndUpdate(
      { slug: req.params.slug },
      updates,
      { new: true, runValidators: true }
    );

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
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