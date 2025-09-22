import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Blog from '../models/Blog.js';
import fs from 'fs'; // Import fs module

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Read blogposts.json
const blogpostsJsonPath = path.join(__dirname, '..', '..', 'client', 'src', 'data', 'blogposts.json');
const rawBlogposts = fs.readFileSync(blogpostsJsonPath, 'utf-8');
const blogpostsData = JSON.parse(rawBlogposts);

// Map blogposts.json data to Blog schema
const mappedBlogs = blogpostsData.map(post => ({
  title: post.title,
  content: post.content, // Assuming content is already HTML
  excerpt: post.excerpt,
  author: "admin@myconvertertool.com", // Default author
  tags: [], // No tags in blogposts.json
  coverImage: post.image ? `/api/blog/images/${post.image}` : '', // Construct coverImage path
  slug: post.id, // Map id to slug
  // readingTime will be calculated by the pre('save') hook
}));

const seedBlogs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    let upsertedCount = 0;
    for (const blogData of mappedBlogs) {
      const result = await Blog.findOneAndUpdate(
        { slug: blogData.slug }, // Find by slug
        blogData, // Data to update or insert
        { upsert: true, new: true, setDefaultsOnInsert: true } // Options: insert if not found, return new doc, apply defaults
      );
      if (result) {
        upsertedCount++;
        console.log(`Blog with slug "${blogData.slug}" was upserted.`);
      }
    }

    console.log('Sample blogs upserted successfully from blogposts.json!');
    console.log(`Upserted ${upsertedCount} blog posts`);
  } catch (error) {
    console.error('Error creating sample blogs:', error);
  } finally {
    await mongoose.disconnect();
  }
};

// Run the script
seedBlogs();