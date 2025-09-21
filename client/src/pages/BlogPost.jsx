import { useState, useEffect } from 'react';
import { useParams, Link } from "react-router-dom";
import SEO from '../utils/SEO.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import MarkdownIt from 'markdown-it'; // Import markdown-it
import DOMPurify from 'dompurify'; // Import dompurify

// Initialize markdown-it with custom renderers
const md = new MarkdownIt({ breaks: false });

// Custom renderer for headings
const defaultRender = md.renderer.rules.heading_open || function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.heading_open = function (tokens, idx, options, env, self) {
  const tagName = tokens[idx].tag; // h1, h2, h3, etc.
  let classes = '';

  switch (tagName) {
    case 'h1':
      classes = 'text-4xl font-extrabold bg-blue-100 text-gray-900 dark:bg-gray-700 dark:text-white p-2 my-8 rounded-md';
      break;
    case 'h2':
      classes = 'text-3xl font-bold bg-blue-50 text-primary dark:bg-gray-800 dark:text-blue-300 p-2 my-6 rounded-sm';
      break;
    case 'h3':
      classes = 'text-2xl font-semibold bg-blue-25 text-primary dark:bg-gray-850 dark:text-blue-400 p-2 my-4 rounded-sm';
      break;
    default:
      classes = ''; // Let prose handle other headings
  }

  // Add the classes to the token's attrs
  if (classes) {
    tokens[idx].attrJoin('class', classes);
  }

  return defaultRender(tokens, idx, options, env, self);
};

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/blog/posts/${slug}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch blog post');
        }

        setPost(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-red-600">❌ Blog Post Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400">The blog post you&apos;re looking for doesn&apos;t exist.</p>
          <Link to="/blog" className="inline-block mt-4 text-blue-600 dark:text-blue-400 hover:underline">
            ← Return to Blog
          </Link>
        </div>
      </div>
    );
  }

  // Format date
  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <article className="min-h-screen">
      {/* Hero Section */}
      <div className="w-full bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <SEO
            title={`${post.title} - MyConverterTool Blog`}
            description={post.excerpt}
            keywords={`${post.title.toLowerCase()}, blog, tutorial, web development, myconvertertool blog`}
            // Note: canonicalUrl, ogType, ogTitle, ogDescription, ogImage, articleMeta are not direct props of SEO component based on SEO.jsx
            // If these are needed, the SEO component itself needs to be updated to accept them.
            // For now, I'm only addressing the missing required props.
          />

          {/* Post Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white text-center leading-tight mb-4">
            {post.title}
          </h1>

          {/* Post Metadata */}
          <div className="flex items-center justify-center space-x-4 text-gray-600 dark:text-gray-400 mb-8">
            <time dateTime={post.createdAt} className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formattedDate}
            </time>
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {post.readingTime || '5 min read'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Featured Image */}
        {post.coverImage && (
          <div className="mb-12 rounded-xl overflow-hidden shadow-xl">
            <img 
              src={post.coverImage} 
              alt={post.title}
              className="w-full h-auto"
              loading="eager"
            />
          </div>
        )}

        {/* Article Content */}
        <div className="prose prose-lg md:prose-xl dark:prose-invert prose-blue mx-auto">
          <div
            className="article-content"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(md.render(post.content)) }}
          />
        </div>

        {/* Author Section */}
        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <img
                className="h-12 w-12 rounded-full dark:invert"
                src="/logo.png"
                alt="MyConverterTool"
              />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {post.author}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Providing free online tools for developers and digital professionals
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-12 flex items-center justify-between">
          <Link
            to="/blog"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </Link>
          {/* Share Button */}
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: post.title,
                  text: post.excerpt,
                  url: window.location.href,
                });
              }
            }}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
        </nav>
      </div>
    </article>
  );
};

export default BlogPost;