import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import SEO from '../utils/SEO.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import BlogPostCard from '../components/BlogPostCard.jsx';

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/blog/posts?page=${page}&limit=9`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch blog posts');
      }

      setPosts(data.posts);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12"
    >
      <SEO 
        seoData={{
          title: 'Free Developer Blog & Coding Tutorials - MyConverterTool',
          description: 'Explore free developer tutorials and blog posts on JSON formatting, SEO, React, Tailwind CSS, and more.',
          keywords: 'developer blog, web development tutorials, coding guides, JSON formatting, SEO basics, React tutorials, Tailwind CSS, free programming resources',
          canonicalUrl: '/blog',
          ogType: 'website',
          ogTitle: 'Free Developer Blog & Coding Tutorials - MyConverterTool',
          ogDescription: 'Read developer-friendly tutorials on web development, JavaScript, React, SEO, and best coding practices.',
          ogImage: '/assets/MyConverterTool.png'
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 font-serif"
          >
            Developer Blog & Tutorials 📖
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 dark:text-gray-300 font-light"
          >
            Explore in-depth coding guides, tips, and tutorials for web developers
          </motion.p>
        </div>

        {error ? (
          <div className="text-center text-red-600 dark:text-red-400">
            <h2 className="text-2xl font-semibold mb-4">Error</h2>
            <p>{error}</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, index) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <BlogPostCard post={post} />
                </motion.div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-12 flex justify-center gap-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default Blog;