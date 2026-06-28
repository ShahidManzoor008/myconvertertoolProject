import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { memo } from 'react';

// ✅ Reusable Blog Card Component with Image, Excerpt & Read More Button
const BlogCard = ({ post }) => {
  return (
    <motion.div 
      whileHover={{ y: -8 }} 
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Link
        to={post.slug ? `/blog/${post.slug}` : '/blog'}
        className="block glass-card h-full flex flex-col group overflow-hidden border-none"
      >
        {post.coverImage && (
          <div className="relative h-56 overflow-hidden">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <span className="px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-bold uppercase tracking-wider">
                Article
              </span>
            </div>
          </div>
        )}

        <div className="p-8 flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            <time>
              {new Date(post.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric'
              })}
            </time>
            <span>•</span>
            <span>{post.readingTime} min read</span>
          </div>

          <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {post.title}
          </h3>
          
          <p className="text-slate-600 dark:text-slate-400 mb-8 line-clamp-3 leading-relaxed">
            {post.excerpt}
          </p>

          <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                {post.author.charAt(0)}
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {post.author}
              </span>
            </div>
            <span className="text-blue-600 dark:text-blue-400 p-2 rounded-full bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
              <span className="material-icons text-sm">arrow_forward</span>
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

export default memo(BlogCard);