import { useState, useEffect, useCallback } from 'react';
import SEO from '../utils/SEO.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import BlogCard from '../components/BlogCard.jsx';
import { blogApi } from '../utils/apiClient';

const PAGE_SIZE = 9;

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const data = await blogApi.getPosts({ limit: PAGE_SIZE });
        setPosts(data.posts || []);
        setNextCursor(data.nextCursor || null);
        setHasNextPage(Boolean(data.hasNextPage));
        setError(null);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setError('Failed to load blog posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (!hasNextPage || loadingMore) return;
    try {
      setLoadingMore(true);
      const data = await blogApi.getPosts({ cursor: nextCursor, limit: PAGE_SIZE });
      setPosts((prev) => [...prev, ...(data.posts || [])]);
      setNextCursor(data.nextCursor || null);
      setHasNextPage(Boolean(data.hasNextPage));
    } catch (err) {
      console.error('Error loading more posts:', err);
      setError('Failed to load more posts. Please try again.');
    } finally {
      setLoadingMore(false);
    }
  }, [hasNextPage, loadingMore, nextCursor]);

  if (loading) {
    return <LoadingSpinner message="Loading insights..." />;
  }

  return (
    <div className="pb-24">
      <SEO
        title="Insights & Guides - MyConverterTool Blog"
        description="Stay ahead with the latest tutorials, technology insights, and productivity guides from the MyConverterTool team."
        keywords="blog, articles, guides, file conversion, productivity, technology"
        canonicalUrl="/blog"
      />

      {/* Header */}
      <section className="text-center py-16 md:py-24">
        <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-blue-600/10 text-blue-600 text-xs font-black uppercase tracking-widest border border-blue-600/20">
          The Feed
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-tight">
          Latest <span className="gradient-text">Insights</span>
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Master your workflow with our expert guides, technical deep-dives, and productivity hacks.
        </p>
      </section>

      {error ? (
        <div className="container mx-auto px-4 text-center py-20 glass rounded-[2rem] text-red-500 font-bold border-red-500/20">
          Error: {error}
        </div>
      ) : (
        <>
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>

          {hasNextPage && (
            <div className="container mx-auto px-4 mt-16 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-8 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loadingMore ? 'Loading…' : 'Load more articles'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Blog;
