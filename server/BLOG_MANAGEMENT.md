# Blog Management System - Documentation

## Overview

The myconvertertool project includes a comprehensive blog management system with pre-populated blog posts and multiple management scripts.

## Current Blog Posts

All blogs are stored in MongoDB and are accessible via REST API. Currently, 7 blog posts are populated:

1. **Understanding JSON Formatting** - Learn about JSON, its uses, and formatting best practices
2. **SEO Basics for Developers** - Essential SEO techniques for developers  
3. **Getting Started with React & Vite** - Modern React development with Vite
4. **How to Use Tailwind CSS Efficiently** - Utility-first CSS framework guide
5. **Exploring Our Development Tools** - Overview of available platform tools
6. **Essential PDF Tools for Your Needs** - PDF management and conversion features
7. **Text Case Conversion Made Easy** - Text transformation utilities

## Blog Database Schema

**Model Location:** `server/models/Blog.js`

```javascript
{
  title: String (required, 3-200 chars),
  content: String (required, min 50 chars),
  excerpt: String (required, 50-200 chars),
  author: String (required),
  tags: [String],
  coverImage: String (URL path),
  readingTime: Number (auto-calculated),
  slug: String (required, unique),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Features:**
- Auto-generated reading time calculation (based on word count)
- Full-text search index on title, content, excerpt, and tags
- URL slug auto-generation from post title
- Timestamps for creation and updates
- Virtual field: `formattedDate` (formatted as "Month Date, Year")

## Available Scripts

Run these commands from the `server` directory:

### 1. **Seed Blogs** (Populate from JSON)
```bash
npm run seed:blogs
```
- Reads blog posts from `client/src/data/blogposts.json`
- Upserts (inserts or updates) posts to MongoDB
- Useful for: Initial setup, refreshing blog data, environment sync

### 2. **Clear Blogs** (Delete All)
```bash
npm run clear:blogs
```
- Deletes ALL blog posts from the database
- ⚠️ **Warning:** This is destructive and cannot be undone
- Useful for: Cleaning up before a fresh seeding

### 3. **Reset Blogs** (Clear + Seed)
```bash
npm run reset:blogs
```
- Combines clear:blogs and seed:blogs in one command
- Removes all posts, then repopulates from JSON
- Useful for: Complete database reset to pristine state

### 4. **Manage Blogs** (Interactive CLI Tool)
```bash
npm run manage:blogs
```
- Interactive command-line tool for blog management
- **Options:**
  1. List all blogs (with metadata)
  2. Add a new blog post (interactive prompts)
  3. Find blog by slug
  4. Delete blog by slug
  5. Delete all blogs
  6. Get blog count
  7. Exit

**Example Usage:**
```
? Choose an option (0-6): 2
? Title: My Amazing Post
? Excerpt (brief summary): Learn how to build amazing things
? Content (HTML or plain text): <p>Full content here...</p>
? Author (default: admin@myconvertertool.com): john@example.com
? Tags (comma-separated, optional): javascript, react, tips
✅ Blog "My Amazing Post" created successfully!
   Slug: my-amazing-post
```

### 5. **Test Blogs** (Verify Database)
```bash
node scripts/testBlogs.js
```
- Quickly checks MongoDB connection and blog count
- Lists all blogs with titles and slugs
- Useful for: Debugging, verifying seeding success

## REST API Endpoints

**Base URL:** `http://localhost:5000/api/blog`

### Get All Posts (Public)
```
GET /posts?page=1&limit=10
```
**Response:**
```json
{
  "posts": [
    {
      "_id": "...",
      "title": "Understanding JSON Formatting",
      "excerpt": "Learn what JSON is...",
      "author": "admin@myconvertertool.com",
      "coverImage": "/api/blog/images/blog1.webp",
      "readingTime": 5,
      "createdAt": "2024-01-15T10:30:00Z",
      "slug": "understanding-json-formatting"
    }
    // ... more posts
  ],
  "currentPage": 1,
  "totalPages": 1,
  "total": 7
}
```

### Get Single Post by Slug (Public)
```
GET /posts/:slug

Example: GET /posts/understanding-json-formatting
```
**Response:**
```json
{
  "_id": "...",
  "title": "Understanding JSON Formatting",
  "content": "<h2>What is JSON?</h2><p>JSON is...</p>",
  "excerpt": "Learn what JSON is...",
  "author": "admin@myconvertertool.com",
  "tags": [],
  "coverImage": "/api/blog/images/blog1.webp",
  "readingTime": 5,
  "slug": "understanding-json-formatting",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "formattedDate": "January 15, 2024"
}
```

### Create New Post (Protected - Requires Auth)
```
POST /posts
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
{
  "title": "New Blog Post",
  "content": "<p>Post content...</p>",
  "excerpt": "Post summary...",
  "author": "admin@myconvertertool.com",
  "tags": ["javascript", "tutorial"],
  "coverImage": <file>  // Optional: image file
}
```

### Update Post (Protected - Requires Auth)
```
PUT /posts/:slug
Headers: Authorization: Bearer <token>
```

### Delete Post (Protected - Requires Auth)
```
DELETE /posts/:slug
Headers: Authorization: Bearer <token>
```

## Source Files

### Blog Posts Data
- **File:** `client/src/data/blogposts.json`
- **Format:** JSON array with blog post objects
- **Used by:** `seedBlogs.js` script
- **Fields:** id, title, excerpt, content (HTML), image

### Database Model
- **File:** `server/models/Blog.js`
- **Exports:** `Blog` Mongoose model
- **Features:** Auto-slug generation, reading time calculation, full-text search

### Controllers
- **File:** `server/controllers/blogController.js`
- **Functions:** 
  - `getAllPosts` - Fetch paginated blog list
  - `getPostBySlug` - Fetch single blog post
  - `createPost` - Create new post (protected)
  - `updatePost` - Update existing post (protected)
  - `deletePost` - Delete post (protected)

### Routes
- **File:** `server/routes/blog.js`
- **Base Route:** `/api/blog`
- **Public Routes:** GET /posts, GET /posts/:slug
- **Protected Routes:** POST /posts, PUT /posts/:slug, DELETE /posts/:slug

### Scripts
- **seedBlogs.js** - Populate database from JSON
- **clearBlogs.js** - Delete all blogs
- **manageBlog.js** - Interactive CLI management tool
- **testBlogs.js** - Verify database status

## Troubleshooting

### No Blogs Appearing
1. Check MongoDB connection: `npm run manage:blogs` → option 6 (Get blog count)
2. Seed the database: `npm run seed:blogs`
3. Verify in database:
   ```bash
   node scripts/testBlogs.js
   ```

### Blogs Not Showing in API
1. Start server: `npm run dev`
2. Test API endpoint: `curl http://localhost:5000/api/blog/posts`
3. Check database is populated: `node scripts/testBlogs.js`

### Can't Add New Blogs
1. Ensure you're authenticated when using protected endpoints
2. Include all required fields: title, content, excerpt, author
3. Check image file type if uploading cover image
4. Use interactive tool: `npm run manage:blogs` → option 2

### Database Connection Issues
1. Verify `MONGODB_URI` in `.env` file
2. Ensure MongoDB service is running
3. Check network connectivity to MongoDB server

## Adding New Blog Posts

### Method 1: Using Interactive CLI
```bash
npm run manage:blogs
```
Then select option 2 and follow the prompts.

### Method 2: Using REST API
```bash
curl -X POST http://localhost:5000/api/blog/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=New Post Title" \
  -F "content=<p>Post content</p>" \
  -F "excerpt=Brief summary" \
  -F "author=author@example.com" \
  -F "tags=javascript,tutorial" \
  -F "coverImage=@path/to/image.jpg"
```

### Method 3: From blogposts.json
1. Add entry to `client/src/data/blogposts.json`
2. Run: `npm run seed:blogs`

## Performance Optimization

The blog system includes:
- **Indexed fields:** author, tags, createdAt (sorted), slug (unique)
- **Full-text search index:** Enables searching by title, content, excerpt, tags
- **Pagination:** Limits query results to avoid memory issues
- **Virtual fields:** Formatted date computed on-the-fly

## Next Steps

- [ ] Implement blog categories
- [ ] Add comment system
- [ ] Create blog search UI
- [ ] Add blog author profiles
- [ ] Implement draft/published status
- [ ] Add blog scheduling
- [ ] Create RSS feed
