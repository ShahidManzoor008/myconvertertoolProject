import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { memo } from 'react';

const BlogCard = ({ post }) => {
  const date = post.updatedAt || post.publishedAt || post.createdAt;
  return <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
    <Link to={`/blog/${post.slug}`} className="group flex h-full flex-col">
      {post.coverImage ? <div className="aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-800"><img src={post.coverThumbnail || post.coverImage} alt={post.coverAlt || ''} width="480" height="270" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" /></div> : <div className="flex aspect-[16/9] items-center justify-center bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><span aria-hidden="true" className="material-icons text-4xl">article</span></div>}
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">{post.category || 'Guides'}</p>
        <h3 className="mt-2 text-lg font-semibold leading-snug tracking-tight text-slate-900 group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">{post.title}</h3>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{post.excerpt}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-5 text-xs text-slate-500 dark:text-slate-400">
          {date && !Number.isNaN(new Date(date).getTime()) && <time dateTime={new Date(date).toISOString()}>{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</time>}
          <span>{Math.max(1, post.readingTime || 1)} min read</span><span className="ml-auto font-semibold text-blue-700 dark:text-blue-300">Read guide <span aria-hidden="true">→</span></span>
        </div>
      </div>
    </Link>
  </article>;
};
BlogCard.propTypes = { post: PropTypes.shape({ title: PropTypes.string.isRequired, slug: PropTypes.string.isRequired, excerpt: PropTypes.string, coverImage: PropTypes.string, coverThumbnail: PropTypes.string, coverAlt: PropTypes.string, category: PropTypes.string, createdAt: PropTypes.string, publishedAt: PropTypes.string, updatedAt: PropTypes.string, readingTime: PropTypes.number }).isRequired };
export default memo(BlogCard);
