import { useState, useEffect, useCallback, useRef } from 'react';
import SEO from '../utils/SEO.jsx';
import BlogCard from '../components/BlogCard.jsx';
import { blogApi, apiClient } from '../utils/apiClient';
import { useSearchParams } from 'react-router-dom';

export default function Blog() {
  const moreRequest = useRef(null);
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '', category = params.get('category') || '';
  const [query, setQuery] = useState(search), [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]), [loading, setLoading] = useState(true), [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(''), [cursor, setCursor] = useState(null), [more, setMore] = useState(false), [reload, setReload] = useState(0);
  useEffect(() => { setQuery(search); }, [search]);
  useEffect(() => { let active = true; apiClient.get('/api/blog/categories').then(data => { if (active && Array.isArray(data)) setCategories(data); }).catch(() => {}); return () => { active = false; }; }, []);
  useEffect(() => {
    let active = true; setLoading(true); setLoadingMore(false); setError('');
    blogApi.getPosts({ limit: 9, search, category }).then(data => {
      if (!active) return;
      setPosts(data.posts || []); setCursor(data.nextCursor); setMore(!!data.hasNextPage);
    }).catch(() => { if (active) setError('Articles could not be loaded. Please try again.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; moreRequest.current?.abort(); };
  }, [search, category, reload]);
  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true); setError('');
    const controller = new AbortController(); moreRequest.current = controller;
    try { const data = await blogApi.getPosts({ cursor, limit: 9, search, category }, { signal: controller.signal }); if (controller.signal.aborted) return; setPosts(current => [...new Map([...current, ...(data.posts || [])].map(post => [post.slug, post])).values()]); setCursor(data.nextCursor); setMore(!!data.hasNextPage); }
    catch { if (!controller.signal.aborted) setError('More articles could not be loaded. Your current results are still here.'); }
    finally { if (moreRequest.current === controller) setLoadingMore(false); }
  }, [cursor, search, category, loadingMore]);
  const updateFilter = (name, value) => { const next = new URLSearchParams(params); if (value) next.set(name, value); else next.delete(name); setParams(next); };
  return <div className="mx-auto max-w-6xl pb-16 pt-8 sm:pt-12">
    <SEO title="Practical Guides & Tutorials | MyConverterTool Blog" description="Clear guides to PDF conversion, spreadsheets, Markdown, JSON, text tools, and website workflows." canonicalUrl="/blog" />
    <header className="max-w-3xl"><p className="text-sm font-semibold text-blue-700 dark:text-blue-300">The MyConverterTool blog</p><h1 className="mt-3 font-bold tracking-tight">Less guesswork.<br /><span className="text-blue-700 dark:text-blue-300">More getting things done.</span></h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-400">Practical walkthroughs for your files, code, and everyday work. Find a guide, follow the steps, and try the tool.</p></header>
    <section aria-label="Find an article" className="my-8 flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40 sm:flex-row sm:items-end">
      <form onSubmit={event => { event.preventDefault(); updateFilter('search', query.trim()); }} className="min-w-0 flex-1"><label htmlFor="blog-search" className="mb-1 block text-sm font-medium">Search guides</label><div className="flex gap-2"><input id="blog-search" type="search" value={query} onChange={event => setQuery(event.target.value)} maxLength={100} placeholder="PDF, JSON, text…" className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" /><button type="submit" className="min-h-11 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white">Search</button></div></form>
      <label className="text-sm font-medium">Topic<select value={category} onChange={event => updateFilter('category', event.target.value)} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900 sm:min-w-44"><option value="">All topics</option>{categories.map(item => <option key={item._id} value={item._id}>{item._id} ({item.count})</option>)}</select></label>
      {(search || category) && <button type="button" onClick={() => setParams({})} className="min-h-11 px-2 text-sm font-semibold text-blue-700 underline dark:text-blue-300">Clear filters</button>}
    </section>
    {error && <div role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">{error} <button type="button" disabled={loading} onClick={() => setReload(value => value + 1)} className="min-h-11 px-2 font-semibold underline">Try again</button></div>}
    {loading ? <p role="status" className="py-12 text-center text-slate-500">Loading guides…</p> : <>
      <h2 className="mb-5 text-lg font-semibold">{search || category ? 'Matching guides' : 'Latest guides'}</h2>
      {!posts.length && !error && <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700"><p className="font-semibold">{search || category ? 'No guides match these filters.' : 'New guides are on the way.'}</p><p className="mt-2 text-sm text-slate-500">{search || category ? 'Try another keyword or browse all topics.' : 'Explore our free tools while we prepare more articles.'}</p></div>}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{posts.map(post => <BlogCard key={post.slug} post={post} />)}</div>
      {more && <div className="mt-8 text-center"><button type="button" onClick={loadMore} disabled={loadingMore} className="min-h-11 rounded-lg border border-slate-300 px-5 text-sm font-semibold disabled:opacity-50 dark:border-slate-600">{loadingMore ? 'Loading…' : 'Load more guides'}</button></div>}
    </>}
  </div>;
}
