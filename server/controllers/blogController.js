import Blog from '../models/Blog.js';
import mongoose from 'mongoose';
import slugify from 'slugify';
import { imageReferences } from '../utils/blogMedia.js';
import { presentPost } from '../utils/blogPresentation.js';
import { plainText, renderBlogContent } from '../utils/blogContent.js';

// Missing status means a legacy article that was already public before this release.
export const publishedFilter = { $or: [{ status: 'published' }, { status: { $exists: false } }] };
let writeQueue = Promise.resolve();
export const withBlogWrite = action => {
  const result = writeQueue.then(action); writeQueue = result.catch(() => {}); return result;
};
const fullPost = async value => {
  const post = presentPost(value);
  return { ...post, ...await renderBlogContent(post.content, post.contentFormat) };
};
export async function getAllPosts(req, res) {
  try {
    const limit = Number(req.query.limit || 9), page = Number(req.query.page || 1), cursor = req.query.cursor;
    if (!Number.isInteger(limit) || limit < 1 || limit > 50 || !Number.isInteger(page) || page < 1 || page > 10000) return res.status(400).json({ message: 'Use a positive page and a limit between 1 and 50.' });
    if (cursor && !mongoose.isObjectIdOrHexString(cursor)) return res.status(400).json({ message: 'Invalid pagination cursor.' });
    const filters = [req.blogAdmin ? {} : publishedFilter];
    if (req.query.category) filters.push({ category: String(req.query.category).slice(0, 60) });
    if (req.query.search) {
      const search = String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filters.push({ $or: [{ title: { $regex: search, $options: 'i' } }, { excerpt: { $regex: search, $options: 'i' } }, { tags: { $regex: search, $options: 'i' } }] });
    }
    if (cursor) {
      const anchor = await Blog.findOne({ _id: cursor, $and: filters }).select('createdAt').lean();
      if (!anchor) return res.status(400).json({ message: 'Unknown pagination cursor.' });
      filters.push({ $or: [{ createdAt: { $lt: anchor.createdAt } }, { createdAt: anchor.createdAt, _id: { $lt: cursor } }] });
    }
    const query = { $and: filters };
    const docs = await Blog.find(query).sort({ createdAt: -1, _id: -1 }).skip(cursor ? 0 : (page - 1) * limit).limit(limit + 1).select('-content').lean();
    const hasNextPage = docs.length > limit;
    const posts = docs.slice(0, limit).map(presentPost);
    const total = !cursor ? await Blog.countDocuments(query) : null;
    res.json({ posts, hasNextPage, nextCursor: hasNextPage ? String(posts.at(-1)._id) : null, total, currentPage: cursor ? null : page, totalPages: total == null ? null : Math.ceil(total / limit) });
  } catch { res.status(500).json({ message: 'Articles are temporarily unavailable. Please try again.' }); }
}
export async function getPostBySlug(req, res) {
  try {
    const post = await Blog.findOne({ slug: req.params.slug, ...(req.blogAdmin ? {} : publishedFilter) }).lean();
    if (!post) return res.status(404).json({ message: 'Article not found.' });
    const result = await fullPost(post);
    // Existing public clients expect content to be renderable HTML. Admin reads retain the original source.
    if (req.blogAdmin) return res.json(result);
    const { html, ...metadata } = result;
    res.json({ ...metadata, sourceFormat: metadata.contentFormat, contentFormat: 'html', content: html });
  } catch { res.status(500).json({ message: 'The article could not be loaded. Please try again.' }); }
}
export async function previewPost(req, res) {
  try { res.json(await renderBlogContent(req.body.content || '', req.body.contentFormat === 'html' ? 'html' : 'markdown')); }
  catch (error) { res.status(400).json({ message: error.message }); }
}
function inputFields(body, existing) {
  const input = {};
  const limits = { title: 200, content: 200000, excerpt: 200, author: 100, category: 60, coverAlt: 250, coverImage: 250, coverThumbnail: 250 };
  for (const key of ['title', 'content', 'excerpt', 'author', 'category', 'coverAlt', 'coverImage', 'coverThumbnail']) {
    if (body[key] !== undefined) { if (typeof body[key] !== 'string') throw new Error(`${key} must be text.`); if (body[key].length > limits[key]) throw new Error(`${key} must be ${limits[key]} characters or fewer.`); input[key] = body[key]; }
  }
  for (const key of ['coverWidth', 'coverHeight', 'coverThumbnailWidth']) {
    if (body[key] !== undefined) { if (!Number.isInteger(body[key]) || body[key] < 0 || body[key] > 40000000) throw new Error('Invalid image dimensions.'); input[key] = body[key]; }
  }
  if (body.authorType !== undefined) {
    if (!['Person', 'Organization'].includes(body.authorType)) throw new Error('Choose an individual or organization author.');
    input.authorType = body.authorType;
  }
  if (body.status !== undefined) {
    if (!['draft', 'published', 'archived'].includes(body.status)) throw new Error('Choose draft, published, or archived.');
    input.status = body.status;
  }
  if (body.contentFormat !== undefined) {
    if (!['markdown', 'html'].includes(body.contentFormat)) throw new Error('Invalid article format.');
    // New writing uses Markdown; only existing legacy articles can retain HTML.
    if (body.contentFormat === 'html' && existing?.contentFormat !== 'html') throw new Error('New articles use Markdown.');
    input.contentFormat = body.contentFormat;
  }
  if (body.tags !== undefined) {
    const tags = Array.isArray(body.tags) ? body.tags : String(body.tags).split(',');
    input.tags = [...new Set(tags.map(value => String(value).trim()).filter(Boolean))].slice(0, 10);
    if (input.tags.some(tag => tag.length > 40)) throw new Error('Tags must be 40 characters or shorter.');
  }
  for (const field of ['coverImage', 'coverThumbnail']) {
    if (input[field] && !/^\/api\/blog\/images\/[A-Za-z0-9_.-]+$/.test(input[field])) throw new Error('Choose an image uploaded to this website.');
  }
  return input;
}
async function savePost(req, res, editing) {
  return withBlogWrite(async () => {
    try {
      let post = editing ? await Blog.findOne({ slug: req.params.slug }) : new Blog({ author: req.user.name || 'MyConverterTool Team', contentFormat: 'markdown' });
      if (!post) return res.status(404).json({ message: 'Article not found.' });
      if (editing && (req.body.revision === undefined || Number(req.body.revision) !== (post.revision || 0))) return res.status(409).json({ message: 'This article changed in another tab. Reload it before saving.' });
      // Explicit legacy defaults prevent an edited older article becoming a draft by accident.
      if (editing && post.$isDefault('status')) post.status = 'published';
      if (editing && post.$isDefault('contentFormat')) post.contentFormat = 'html';
      Object.assign(post, inputFields(req.body, post));
      post.title = (post.title || '').trim();
      if (post.title.length < 3 || post.title.length > 200) throw new Error('Enter a title between 3 and 200 characters.');
      if (!editing) {
        const base = slugify(post.title, { lower: true, strict: true }).slice(0, 180) || 'article';
        post.slug = await Blog.exists({ slug: base }) ? `${base}-${post._id.toString().slice(-8)}` : base;
      }
      post.excerpt = (post.excerpt || '').trim();
      post.category = post.category?.trim() || 'Guides';
      post.author = post.author?.trim();
      if (!post.excerpt) post.excerpt = plainText(post.content).slice(0, 190);
      const rendered = await renderBlogContent(post.content || '', post.contentFormat);
      if (post.status === 'published' && plainText(rendered.html).length < 50) throw new Error('Published articles need at least 50 characters of readable content.');
      if (post.status === 'published' && post.coverImage && !post.coverAlt?.trim()) throw new Error('Add alt text describing the featured image before publishing.');
      if (post.status === 'published' && !post.publishedAt) post.publishedAt = new Date();
      post.readingTime = rendered.readingTime;
      post.imageFiles = imageReferences(post);
      post.revision = (post.revision || 0) + 1;
      await post.save();
      res.status(editing ? 200 : 201).json({ ...presentPost(post), ...rendered });
    } catch (error) { res.status(error.code === 11000 ? 409 : 400).json({ message: error.message }); }
  });
}
export const createPost = (req, res) => savePost(req, res, false);
export const updatePost = (req, res) => savePost(req, res, true);
export const deletePost = (req, res) => withBlogWrite(async () => {
  try {
    const post = await Blog.findOneAndDelete({ slug: req.params.slug });
    if (!post) return res.status(404).json({ message: 'Article not found.' });
    res.json({ message: 'Article deleted. Unused images are retained for manual cleanup.' });
  } catch { res.status(500).json({ message: 'The article could not be deleted.' }); }
});
