import { useState, useEffect } from 'react';
import SEO from '../utils/SEO.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import BlogCard from '../components/BlogCard.jsx';
import { blogApi } from '../utils/apiClient';

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const data = await blogApi.getPosts();
        setPosts(data.posts || []);
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
      <section className="text-center py-16 md:py-24" data-aos="fade-down">
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
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10" data-aos="fade-up">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Blog;
