import mongoose from 'mongoose';
import { readingMinutes } from '../utils/blogPresentation.js';

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long'],
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  content: {
    type: String,
    default: '',
    maxlength: 200000
  },
  excerpt: {
    type: String,
    default: '',
    trim: true,
    maxlength: [200, 'Excerpt cannot be more than 200 characters']
  },
  author: {
    type: String,
    trim: true,
    maxlength: 100,
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  coverImage: {
    type: String,
    default: ''
  },
  authorType: { type: String, enum: ['Person', 'Organization'], default: 'Person' },
  contentFormat: { type: String, enum: ['html', 'markdown'], default: 'markdown' },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  category: { type: String, trim: true, maxlength: 60, default: 'Guides' },
  imageFiles: [{ type: String }],
  coverAlt: { type: String, trim: true, maxlength: 250, default: '' },
  coverWidth: Number,
  coverHeight: Number,
  coverThumbnailWidth: Number,
  coverThumbnail: { type: String, default: '' },
  publishedAt: { type: Date, default: null },
  revision: { type: Number, default: 0 },
  editorialRevision: { type: String, default: '' },
  aiWriter: {
    generationId: String,
    topicKey: String,
    eventDate: String,
    sources: [{ _id: false, url: String, title: String, publishedAt: Date }],
    model: String,
    generatedAt: Date,
  },
  readingTime: {
    type: Number,
    default: 0
  },
  slug: {
    type: String,
    required: true,
    unique: true
  }
}, {
  timestamps: true
});

// Calculate reading time before saving
blogSchema.pre('save', function() {
  this.readingTime = readingMinutes(this.content);
});

// Add indexes for better query performance
// Note: `slug` already has `unique: true` on the field definition above —
// creating the same index with schema.index() can trigger duplicate index warnings
// from Mongoose (defined both via field option and schema.index()).
// We rely on the field-level `unique: true` so remove the separate index() call.
blogSchema.index({ author: 1 });
blogSchema.index({ imageFiles: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ createdAt: -1 });
blogSchema.index({ status: 1, createdAt: -1, _id: -1 });
blogSchema.index({ 'aiWriter.generationId': 1 }, { unique: true, sparse: true });
blogSchema.index({ 'aiWriter.topicKey': 1 }, { unique: true, sparse: true });

// Add text index for search functionality
blogSchema.index({
  title: 'text',
  content: 'text',
  excerpt: 'text',
  tags: 'text'
}, {
  weights: {
    title: 10,
    tags: 5,
    excerpt: 3,
    content: 1
  }
});

// Add virtual for formatted date
blogSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Ensure virtuals are included when converting to JSON
blogSchema.set('toJSON', { virtuals: true });
blogSchema.set('toObject', { virtuals: true });

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;
