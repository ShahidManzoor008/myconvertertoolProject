import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { memo } from "react";

const BlogPostCard = ({ post }) => {
  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }}>
      <Link
        to={`/blog/${post.slug}`}
        className="block bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 group"
        aria-label={`Read ${post.title}`}
      >
        {post.coverImage && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        )}

        <div className="p-6">
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

          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {post.title}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
            {post.excerpt}
          </p>

          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              By {post.author}
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-medium group-hover:text-blue-800 dark:group-hover:text-blue-300">
              Read more →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

BlogPostCard.propTypes = {
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

export default memo(BlogPostCard);