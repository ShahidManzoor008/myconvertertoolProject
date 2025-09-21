import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    required: true,
    maxLength: 200
  },
  author: {
    type: String,
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
blogSchema.pre('save', function(next) {
  const wordsPerMinute = 200;
  const wordCount = this.content.split(/\s+/).length;
  this.readingTime = Math.ceil(wordCount / wordsPerMinute);
  next();
});

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;