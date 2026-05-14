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
  // ... fetch and error logic stays same

  return (
    <article className="pb-24">
      <SEO
        title={`${post.title} - ConverterPro`}
        description={post.excerpt}
        keywords={`${post.title.toLowerCase()}, blog, tutorial, converterpro`}
        canonicalUrl={`/blog/${post.slug}`}
        ogImage={post.coverImage || '/assets/MyConverterTool.png'}
      />

      {/* Header */}
      <header className="pt-16 pb-20 text-center relative overflow-hidden" data-aos="fade-down">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest">
              {post.category || 'Article'}
            </span>
            <span className="text-slate-400">•</span>
            <time className="text-slate-500 font-bold text-xs uppercase tracking-wider">
              {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </time>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-10 leading-[1.1] text-slate-900 dark:text-white">
            {post.title}
          </h1>

          <div className="flex items-center justify-center gap-6 pt-6 border-t border-slate-200/50 dark:border-slate-800/50 max-w-xs mx-auto">
            <div className="flex items-center gap-2">
              <span className="material-icons text-blue-600 text-sm">schedule</span>
              <span className="text-sm font-black text-slate-600 dark:text-slate-400">{post.readingTime}m Read</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-icons text-blue-600 text-sm">visibility</span>
              <span className="text-sm font-black text-slate-600 dark:text-slate-400">Pro Content</span>
            </div>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {post.coverImage && (
        <div className="max-w-6xl mx-auto px-4 mb-20" data-aos="zoom-out">
          <div className="aspect-[21/9] rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white dark:border-slate-800">
            <img 
              src={post.coverImage} 
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4">
        <div className="prose prose-slate dark:prose-invert prose-lg md:prose-xl prose-headings:font-black prose-headings:tracking-tighter prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-img:rounded-3xl prose-img:shadow-xl prose-pre:bg-slate-900 prose-pre:rounded-2xl">
          <div
            className="article-content leading-relaxed"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
          />
        </div>

        {/* Footer Actions */}
        <div className="mt-24 pt-12 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/25">
              {post.author.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-blue-600 mb-1">Written By</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">{post.author}</h4>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="p-4 rounded-2xl glass hover:bg-blue-600 hover:text-white transition-all group"
            >
              <span className="material-icons group-hover:-translate-y-1 transition-transform">arrow_upward</span>
            </button>
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: post.title, url: window.location.href });
                }
              }}
              className="px-8 py-4 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <span className="material-icons text-sm">share</span>
              Share Article
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default BlogPost;