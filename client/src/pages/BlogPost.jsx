import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import SEO from '../utils/SEO.jsx';
import BlogCard from '../components/BlogCard';
import { blogApi } from '../utils/apiClient';

export default function BlogPost() {
  const { slug } = useParams();
  const [tocOpen, setTocOpen] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const update = () => setTocOpen(desktop.matches); desktop.addEventListener('change', update);
    return () => desktop.removeEventListener('change', update);
  }, []);
  const [post, setPost] = useState(null), [related, setRelated] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState(''), [shareMessage, setShareMessage] = useState('');
  useEffect(() => {
    let active = true; setLoading(true); setError(''); setShareMessage(''); setRelated([]);
    blogApi.getPost(slug).then(async data => {
      if (!active) return; setPost(data); setLoading(false);
      try { const result = await blogApi.getPosts({ category: data.category, limit: 4 }); if (active) setRelated((result.posts || []).filter(item => item.slug !== data.slug).slice(0, 3)); } catch { /* Related reading is optional. */ }
    }).catch(failure => { if (active) { setError(failure.status === 404 ? 'not-found' : 'unavailable'); setLoading(false); } });
    return () => { active = false; };
  }, [slug]);
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: post.title, url: location.href });
      else { await navigator.clipboard.writeText(location.href); setShareMessage('Article link copied.'); }
    } catch (failure) { if (failure.name !== 'AbortError') setShareMessage(`Copy this link: ${location.href}`); }
  };
  if (loading) return <p role="status" className="py-16 text-center text-slate-500">Loading article…</p>;
  if (error || !post) return <section className="mx-auto max-w-xl py-16 text-center"><SEO title="Article unavailable | MyConverterTool" robots="noindex, follow" /><h1>{error === 'not-found' ? 'Article not found' : 'Article temporarily unavailable'}</h1><p className="mt-4 text-slate-500">{error === 'not-found' ? 'This article may have been removed or is not published.' : 'We could not load the article. Please try again shortly.'}</p><Link to="/blog" className="mt-5 inline-flex min-h-11 items-center font-semibold text-blue-700 dark:text-blue-300">Browse all guides</Link></section>;
  const date = post.publishedAt || post.createdAt;
  const updated = post.updatedAt && new Date(post.updatedAt).toDateString() !== new Date(date).toDateString();
  const displayedDate = updated ? post.updatedAt : date;
  return <article className="blog-reader mx-auto max-w-6xl pb-16 pt-6 sm:pt-10">
    <SEO title={`${post.title} | MyConverterTool`} description={post.excerpt} canonicalUrl={`/blog/${post.slug}`} ogImage={post.coverImage || '/assets/og-default.png'} ogType="article" jsonLd={{ '@context': 'https://schema.org', '@type': 'Article', headline: post.title, description: post.excerpt, image: new URL(post.coverImage || '/assets/og-default.png', 'https://myconvertertool.com').href, datePublished: date, dateModified: post.updatedAt || date, author: { '@type': post.authorType || 'Person', name: post.author || 'MyConverterTool Team' }, publisher: { '@type': 'Organization', name: 'MyConverterTool' }, mainEntityOfPage: `https://myconvertertool.com/blog/${post.slug}` }} />
    <nav aria-label="Article breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500"><Link to="/" className="inline-flex min-h-11 items-center hover:text-blue-700">Home</Link><span aria-hidden="true">/</span><Link to="/blog" className="inline-flex min-h-11 items-center hover:text-blue-700">Guides</Link><span aria-hidden="true">/</span><Link to={`/blog?category=${encodeURIComponent(post.category || 'Guides')}`} className="inline-flex min-h-11 items-center font-medium text-blue-700 dark:text-blue-300">{post.category || 'Guides'}</Link></nav>
    <header className="max-w-4xl"><p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{post.category || 'Guides'}</p><h1 className="mt-3 font-bold tracking-tight">{post.title}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-400">{post.excerpt}</p><div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400"><span>{post.author || 'MyConverterTool Team'}</span>{date && <time dateTime={displayedDate}>{updated ? 'Updated ' : ''}{new Date(displayedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time>}<span>{post.readingTime || 1} min read</span></div></header>
    {post.coverImage && <figure className="my-7 aspect-[16/9] max-h-[24rem] overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800"><img src={post.coverImage} srcSet={post.coverThumbnail ? `${post.coverThumbnail} ${post.coverThumbnailWidth || 480}w, ${post.coverImage} ${post.coverWidth || 1280}w` : undefined} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1152px" width="1280" height="720" fetchPriority="high" decoding="async" alt={post.coverAlt || ''} className="h-full w-full object-cover" /></figure>}
    <div className="mt-8 grid min-w-0 items-start gap-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
      <aside className="min-w-0 lg:sticky lg:top-24" aria-label="Article navigation">
        {!!post.headings?.length && <details open={tocOpen} onToggle={event => setTocOpen(event.currentTarget.open)} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"><summary className="text-sm font-semibold">On this page</summary><nav aria-label="Table of contents" className="mt-3 max-h-80 overflow-y-auto"><ul className="space-y-1">{post.headings.map(heading => <li key={heading.id}><a href={`#${heading.id}`} className={`block py-2 text-sm leading-5 text-slate-600 hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-300 ${heading.level > 2 ? 'pl-3' : ''}`}>{heading.text}</a></li>)}</ul></nav></details>}
        <Link to="/tools" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 dark:text-blue-300">Explore free tools <span aria-hidden="true" className="ml-2">→</span></Link>
      </aside>
      <div className="min-w-0 max-w-3xl">
        <div className="article-body" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.html ?? (post.contentFormat !== 'markdown' ? post.content : '')) }} />
        {!!post.tags?.length && <div className="mt-8 flex flex-wrap gap-2" aria-label="Article tags">{post.tags.map(tag => <Link key={tag} to={`/blog?search=${encodeURIComponent(tag)}`} className="inline-flex min-h-11 items-center rounded-lg bg-slate-100 px-3 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{tag}</Link>)}</div>}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5 dark:border-slate-700"><Link to="/blog" className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 dark:text-blue-300">← All guides</Link><button type="button" onClick={share} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold dark:border-slate-600">Share article</button></div>{shareMessage && <p role="status" className="mt-3 break-all text-sm text-slate-600 dark:text-slate-400">{shareMessage}</p>}
      </div>
    </div>
    {!!related.length && <section className="mt-12 border-t border-slate-200 pt-8 dark:border-slate-700" aria-labelledby="related-heading"><h2 id="related-heading" className="mb-5 text-xl font-semibold">Keep learning</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{related.map(item => <BlogCard key={item.slug} post={item} />)}</div></section>}
  </article>;
}
