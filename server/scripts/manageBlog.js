import 'dotenv/config';
import mongoose from 'mongoose';
import Blog from '../models/Blog.js';
import slugify from 'slugify';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise((resolve) => {
  rl.question(prompt, resolve);
});

const manageBlog = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('\n=== Blog Management Tool ===\n');
    console.log('1. List all blogs');
    console.log('2. Add a new blog post');
    console.log('3. Find blog by slug');
    console.log('4. Delete blog by slug');
    console.log('5. Delete all blogs');
    console.log('6. Get blog count');
    console.log('0. Exit\n');

    const choice = await question('Choose an option (0-6): ');

    switch (choice) {
      case '1':
        await listAllBlogs();
        break;
      case '2':
        await addNewBlog();
        break;
      case '3':
        await findBlogBySlug();
        break;
      case '4':
        await deleteBlogBySlug();
        break;
      case '5':
        await deleteAllBlogs();
        break;
      case '6':
        await getBlogCount();
        break;
      case '0':
        console.log('Exiting...');
        break;
      default:
        console.log('Invalid choice');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
};

const listAllBlogs = async () => {
  try {
    const blogs = await Blog.find().select('title slug author createdAt readingTime');
    if (blogs.length === 0) {
      console.log('\n❌ No blogs found in the database\n');
      return;
    }
    console.log(`\n✅ Found ${blogs.length} blog(s):\n`);
    blogs.forEach((blog, index) => {
      console.log(`${index + 1}. "${blog.title}"`);
      console.log(`   Slug: ${blog.slug}`);
      console.log(`   Author: ${blog.author}`);
      console.log(`   Reading Time: ${blog.readingTime} min`);
      console.log(`   Created: ${blog.createdAt.toLocaleDateString()}\n`);
    });
  } catch (error) {
    console.error('Error listing blogs:', error.message);
  }
};

const addNewBlog = async () => {
  try {
    console.log('\n--- Add New Blog Post ---\n');
    const title = await question('Title: ');
    const excerpt = await question('Excerpt (brief summary): ');
    const content = await question('Content (HTML or plain text): ');
    const author = await question('Author (default: admin@myconvertertool.com): ') || 'admin@myconvertertool.com';
    const tagsInput = await question('Tags (comma-separated, optional): ');
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : [];

    const slug = slugify(title, { lower: true, strict: true });

    const blog = new Blog({
      title,
      excerpt,
      content,
      author,
      tags,
      slug
    });

    await blog.save();
    console.log(`\n✅ Blog "${title}" created successfully!`);
    console.log(`   Slug: ${slug}\n`);
  } catch (error) {
    console.error('Error adding blog:', error.message);
  }
};

const findBlogBySlug = async () => {
  try {
    const slug = await question('\nEnter blog slug: ');
    const blog = await Blog.findOne({ slug });
    
    if (!blog) {
      console.log(`\n❌ Blog with slug "${slug}" not found\n`);
      return;
    }

    console.log(`\n✅ Blog found:\n`);
    console.log(`Title: ${blog.title}`);
    console.log(`Slug: ${blog.slug}`);
    console.log(`Author: ${blog.author}`);
    console.log(`Excerpt: ${blog.excerpt}`);
    console.log(`Content: ${blog.content.substring(0, 200)}...`);
    console.log(`Tags: ${blog.tags.length > 0 ? blog.tags.join(', ') : 'None'}`);
    console.log(`Reading Time: ${blog.readingTime} min`);
    console.log(`Created: ${blog.createdAt.toLocaleDateString()}\n`);
  } catch (error) {
    console.error('Error finding blog:', error.message);
  }
};

const deleteBlogBySlug = async () => {
  try {
    const slug = await question('\nEnter blog slug to delete: ');
    const blog = await Blog.findOneAndDelete({ slug });
    
    if (!blog) {
      console.log(`\n❌ Blog with slug "${slug}" not found\n`);
      return;
    }

    console.log(`\n✅ Blog "${blog.title}" deleted successfully!\n`);
  } catch (error) {
    console.error('Error deleting blog:', error.message);
  }
};

const deleteAllBlogs = async () => {
  try {
    const confirm = await question('\n⚠️  Are you sure you want to delete ALL blogs? (yes/no): ');
    if (confirm.toLowerCase() !== 'yes') {
      console.log('Cancelled.\n');
      return;
    }

    const result = await Blog.deleteMany({});
    console.log(`\n✅ Deleted ${result.deletedCount} blog(s) successfully!\n`);
  } catch (error) {
    console.error('Error deleting blogs:', error.message);
  }
};

const getBlogCount = async () => {
  try {
    const count = await Blog.countDocuments();
    console.log(`\n📊 Total blogs in database: ${count}\n`);
  } catch (error) {
    console.error('Error getting blog count:', error.message);
  }
};

manageBlog();
