import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import AOS from "aos";
import "aos/dist/aos.css";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import blogPosts from "../data/blogposts.json"; 
import blog1 from "../assets/blog1.webp";
import blog2 from "../assets/blog2.webp";
import blog3 from "../assets/blog3.webp";
import blog4 from "../assets/blog4.webp";

// ✅ Map blog images for local loading
const blogImages = {
  "blog1.webp": blog1,
  "blog2.webp": blog2,
  "blog3.webp": blog3,
  "blog4.webp": blog4
};

const Blog = () => {
  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 max-w-6xl mx-auto"
    >
      {/* ✅ SEO Metadata */}
      <Helmet>
        <title>Free Developer Blog & Coding Tutorials - SMS Coding Online</title>
        <meta name="description" content="Explore free developer tutorials and blog posts on JSON formatting, SEO, React, Tailwind CSS, and more." />
        <meta name="keywords" content="developer blog, web development tutorials, coding guides, JSON formatting, SEO basics, React tutorials, Tailwind CSS, free programming resources" />
        <meta property="og:title" content="Free Developer Blog & Coding Tutorials - SMS Coding Online" />
        <meta property="og:description" content="Read developer-friendly tutorials on web development, JavaScript, React, SEO, and best coding practices." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://myconvertertool.com/blog" />
        <link rel="canonical" href="https://myconvertertool.com/blog" />
      </Helmet>

      <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400 text-center" data-aos="fade-up">
        Developer Blog & Tutorials 📖
      </h1>
      <p className="mt-4 text-gray-700 dark:text-gray-300 text-center" data-aos="fade-up">
        Explore in-depth coding guides, tips, and tutorials for web developers.
      </p>

      {/* ✅ Blog Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
        {blogPosts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </motion.div>
  );
};

// ✅ Reusable Blog Card Component with Image, Excerpt & Read More Button
const BlogCard = ({ post }) => {
  return (
    <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }}>
      <Link
        to={`/blog/${post.id}`}
        className="block bg-white dark:bg-gray-800 rounded-md shadow-md border border-gray-200 dark:border-gray-700 transition duration-300 hover:shadow-xl overflow-hidden"
      >
        {/* ✅ Blog Image with Lazy Loading */}
        <div className="h-40 w-full overflow-hidden">
          <img
            src={blogImages[post.image]} // ✅ Loads Local Image from `src/assets/`
            alt={post.title}
            className="w-full h-full object-cover"
            loading="lazy" // ✅ Improves Performance
          />
        </div>

        {/* ✅ Blog Content */}
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">{post.title}</h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">{post.excerpt}</p>
          <span className="text-blue-500 dark:text-blue-400 mt-4 inline-block font-medium">
            Read More →
          </span>
        </div>
      </Link>
    </motion.div>
  );
};

export default Blog;
