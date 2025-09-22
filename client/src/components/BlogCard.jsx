import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

// ✅ Reusable Blog Card Component with Image, Excerpt & Read More Button
const BlogCard = ({ post }) => {
  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }}>
      <Link
        to={post.slug ? `/blog/${post.slug}` : '/blog'} // Fallback to /blog if slug is missing
        className="block bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 group p-4 sm:p-6"
        onClick={(e) => {
          if (!post.slug) {
            e.preventDefault(); // Prevent navigation if slug is missing
            // Optionally, show a message to the user that the post is unavailable
            console.warn(`Blog post "${post.title}" is missing a slug and cannot be viewed.`);
          }
        }}
      >
        {post.coverImage && (
          <div className="relative h-32 sm:h-48 overflow-hidden">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        )}

        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-4 mb-4">
            <time className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(post.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </time>
            <span className="text-gray-500 dark:text-gray-400">•</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {post.readingTime} min read
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {post.title}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 text-sm sm:text-base">
            {post.excerpt}
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-1">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              By {post.author}
            </span>
            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium group-hover:text-blue-800 dark:group-hover:text-blue-300 mt-1 sm:mt-0">
              Read more →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

BlogCard.propTypes = {
  post: PropTypes.shape({
    title: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    excerpt: PropTypes.string.isRequired,
    coverImage: PropTypes.string,
    author: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    readingTime: PropTypes.number.isRequired,
  }).isRequired,
};

export default BlogCard;