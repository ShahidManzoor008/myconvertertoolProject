import 'dotenv/config';
import mongoose from 'mongoose';
import Blog from '../models/Blog.js';

const testBlogs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const count = await Blog.countDocuments();
    console.log(`📊 Total blogs in database: ${count}\n`);

    if (count > 0) {
      const blogs = await Blog.find().select('title slug author');
      console.log('📝 Blog posts:\n');
      blogs.forEach((blog, index) => {
        console.log(`${index + 1}. ${blog.title}`);
        console.log(`   Slug: ${blog.slug}`);
        console.log(`   Author: ${blog.author}\n`);
      });
    } else {
      console.log('❌ No blogs found. Run: npm run seed:blogs\n');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
};

testBlogs();
