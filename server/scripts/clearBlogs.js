import 'dotenv/config';
import mongoose from 'mongoose';
import Blog from '../models/Blog.js';

const clearBlogs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await Blog.deleteMany({});
    console.log('All blogs cleared successfully!');
  } catch (error) {
    console.error('Error clearing blogs:', error);
  } finally {
    await mongoose.disconnect();
  }
};

// Run the script
clearBlogs();