import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient, blogApi } from '../../utils/apiClient';
import { useAuth } from '../../hooks/useAuth';
import DOMPurify from 'dompurify';

const empty = { title: '', content: '', excerpt: '', author: '', authorType: 'Person', category: 'Guides', tags: [], coverImage: '', coverThumbnail: '', coverWidth: 0, coverHeight: 0, coverThumbnailWidth: 0, coverAlt: '', status: 'draft', contentFormat: 'markdown', revision: 0 };
const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white';
const tools = [['H2', '## ', 'Section heading', ''], ['H3', '### ', 'Subsection heading', ''], ['Bold', '**', 'bold text', '**'], ['Italic', '*', 'italic text', '*'], ['List', '- ', 'List item', ''], ['Numbered list', '1. ', 'List item', ''], ['Quote', '> ', 'Quoted text', ''], ['Code', '```\n', 'code here', '\n```'], ['Table', '\n| Column | Value |\n| --- | --- |\n| ', 'Example', ' | Value |\n'], ['Link', '[', 'link text', '](/tools)']];

export default function EditBlogPost() {
  const { slug } = useParams(), navigate = useNavigate(), { user } = useAuth();
  const [form, setForm] = useState({ ...empty, author: user?.name || 'MyConverterTool Team' });
  const [saved, setSaved] = useState('');
  const [loading, setLoading] = useState(!!slug), [saving, setSaving] = useState(false), [uploading, setUploading] = useState(false);
  const [error, setError] = useState(''), [previewError, setPreviewError] = useState(''), [notice, setNotice] = useState('');
  const [preview, setPreview] = useState({ html: '', readingTime: 1 }), [previewing, setPreviewing] = useState(false), [tab, setTab] = useState('write');
  const [recovery, setRecovery] = useState(null);
  const editor = useRef(null);
  const key = `mct-blog-draft:${user?._id || user?.id || 'admin'}:${slug || 'new'}`;
  const dirty = !!saved && JSON.stringify(form) !== saved;
  useEffect(() => {
    let active = true;
    setLoading(!!slug); setError('');
    const load = async () => {
      try {
        const data = slug ? await apiClient.get(`/api/blog/manage/posts/${encodeURIComponent(slug)}`) : { ...empty, author: user?.name || 'MyConverterTool Team' };
        const next = Object.fromEntries(Object.keys(empty).map(field => [field, data[field] ?? empty[field]]));
        if (!active) return;
        setForm(next); setSaved(JSON.stringify(next));
        try {
          const copy = sessionStorage.getItem(key);
          if (copy && copy !== JSON.stringify(next)) setRecovery(JSON.parse(copy));
        } catch { /* Recovery is optional when browser storage is blocked. */ }
      } catch (failure) { if (active) setError(failure.message || 'The article could not be loaded.'); }
      finally { if (active) setLoading(false); }
    };
    load(); return () => { active = false; };
  }, [slug, key, user?.name]);
  useEffect(() => {
    if (loading) return;
    const controller = new AbortController();
    setPreviewing(true);
    const timer = setTimeout(async () => {
      try {
        const result = await apiClient.post('/api/blog/preview', { content: form.content, contentFormat: form.contentFormat }, { signal: controller.signal });
        if (!controller.signal.aborted) { setPreview(result); setPreviewError(''); }
      } catch (failure) { if (!controller.signal.aborted) setPreviewError(failure.message || 'Preview unavailable. Your text is still in the editor.'); }
      finally { if (!controller.signal.aborted) setPreviewing(false); }
    }, 2500);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [form.content, form.contentFormat, loading]);
  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => { try { sessionStorage.setItem(key, JSON.stringify(form)); } catch { /* Optional recovery. */ } }, 700);
    const unload = event => { event.preventDefault(); event.returnValue = ''; };
    const followLink = event => {
      const link = event.target.closest('a[href]');
      if (!link || link.target === '_blank' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const target = new URL(link.href, location.href);
      if (target.pathname === location.pathname && target.search === location.search) return;
      if (!window.confirm('Leave this article with unsaved changes? Save a draft to keep your work.')) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener('beforeunload', unload); document.addEventListener('click', followLink, true);
    return () => { clearTimeout(timer); window.removeEventListener('beforeunload', unload); document.removeEventListener('click', followLink, true); };
  }, [dirty, form, key]);
  const change = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  const insert = (before, sample, after = '') => {
    const start = editor.current?.selectionStart ?? form.content.length, end = editor.current?.selectionEnd ?? start;
    const selection = form.content.slice(start, end) || sample;
    setForm(current => ({ ...current, content: current.content.slice(0, start) + before + selection + after + current.content.slice(end) }));
    setTab('write'); requestAnimationFrame(() => { editor.current?.focus(); editor.current?.setSelectionRange(start + before.length, start + before.length + selection.length); });
  };
  const upload = async (event, inline = false) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { setError('Choose an image up to 8 MB.'); return; }
    const alt = inline ? window.prompt('Describe this image for readers using a screen reader:') : '';
    if (inline && !alt?.trim()) return;
    setUploading(true); setError('');
    try {
      const data = new FormData(); data.append('image', file);
      const image = await blogApi.uploadImage(data);
      if (inline) insert('\n![', alt.replace(/[[\]\n]/g, ''), `](${image.url})\n`);
      else setForm(current => ({ ...current, coverImage: image.url, coverThumbnail: image.thumbnail, coverWidth: image.width, coverHeight: image.height, coverThumbnailWidth: image.thumbnailWidth }));
    } catch (failure) { setError(failure.message || 'Image upload failed.'); }
    finally { setUploading(false); }
  };
  const save = async status => {
    setSaving(true); setError(''); setNotice('');
    try {
      const payload = { ...form, status };
      const result = slug ? await apiClient.put(`/api/blog/posts/${encodeURIComponent(slug)}`, payload) : await apiClient.post('/api/blog/posts', payload);
      const next = Object.fromEntries(Object.keys(empty).map(field => [field, result[field] ?? empty[field]]));
      setForm(next); setSaved(JSON.stringify(next));
      try { sessionStorage.removeItem(key); } catch { /* Optional recovery. */ }
      setNotice(status === 'published' ? 'Article published.' : status === 'archived' ? 'Article archived.' : 'Draft saved. It is not public.');
      if (!slug) navigate(`/admin/posts/${result.slug}/edit`, { replace: true });
    } catch (failure) { setError(failure.message || 'Saving failed. Your changes are still in the editor.'); }
    finally { setSaving(false); }
  };
  if (loading) return <p role="status">Loading article…</p>;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="font-semibold">{slug ? 'Edit article' : 'New article'}</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Write Markdown or paste an AI draft, review the preview, then publish.</p></div><Link to="/admin/posts" className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 dark:text-blue-300">Back to articles</Link></div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
    {notice && <p role="status" className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950/30 dark:text-green-200">{notice}</p>}
    {recovery && <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">An unsaved copy is available in this tab. <button type="button" onClick={() => { setForm({ ...form, ...recovery }); setRecovery(null); }} className="min-h-11 px-3 font-semibold underline">Restore copy</button><button type="button" onClick={() => { setRecovery(null); try { sessionStorage.removeItem(key); } catch { /* Optional storage. */ } }} className="min-h-11 px-3 underline">Discard copy</button></div>}
    <label className="block text-sm font-semibold">Article title<input name="title" value={form.title} onChange={change} maxLength={200} className={inputClass} placeholder="A clear, useful title" /></label>
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_17rem]">
      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800" aria-label="Article editor">
        <div className="flex flex-wrap gap-1 border-b border-slate-200 p-2 dark:border-slate-700">
          {tools.map(([label, before, sample, after]) => <button type="button" key={label} disabled={form.contentFormat !== 'markdown'} onClick={() => insert(before, sample, after)} className="min-h-11 rounded-md px-3 text-xs font-semibold hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-700">{label}</button>)}
          <label className={`inline-flex min-h-11 cursor-pointer items-center rounded-md px-3 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 ${uploading ? 'opacity-50' : ''}`}>Insert image<input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Insert image into article" disabled={uploading || form.contentFormat !== 'markdown'} onChange={event => upload(event, true)} className="sr-only" /></label>
        </div>
        <div className="flex gap-2 border-b border-slate-200 p-2 dark:border-slate-700 lg:hidden" role="group" aria-label="Editor view">{['write', 'preview'].map(value => <button type="button" key={value} aria-pressed={tab === value} onClick={() => setTab(value)} className={`min-h-11 flex-1 rounded-lg text-sm font-semibold ${tab === value ? 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200' : ''}`}>{value === 'write' ? 'Write' : 'Preview'}</button>)}</div>
        <div className="grid min-w-0 lg:grid-cols-2">
          <div className={`min-w-0 p-4 ${tab !== 'write' ? 'hidden lg:block' : ''}`}><label htmlFor="article-markdown" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">{form.contentFormat === 'html' ? 'Legacy HTML source' : 'Markdown'}</label><textarea id="article-markdown" ref={editor} name="content" value={form.content} onChange={change} maxLength={200000} spellCheck className="h-[30rem] min-h-[24rem] w-full resize-y lg:h-[36rem] bg-transparent font-mono text-sm leading-7 outline-none" placeholder={'## Start with a useful section\n\nPaste your draft here. Use **bold**, lists, tables, and code.'} /></div>
          <div className={`min-w-0 border-slate-200 p-4 dark:border-slate-700 lg:border-l ${tab !== 'preview' ? 'hidden lg:block' : ''}`}><div className="mb-4 flex justify-between gap-3 text-xs font-semibold text-slate-500"><span>Reader preview</span><span role="status">{previewing ? 'Updating…' : `${preview.readingTime} min read`}</span></div>{previewError ? <p role="alert" className="text-sm text-red-700 dark:text-red-300">{previewError}</p> : <div role="region" aria-label="Scrollable reader preview" tabIndex={0} className="article-body markdown-preview" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(preview.html) }} />}</div>
        </div>
        <p className="border-t border-slate-200 px-4 py-3 text-xs leading-5 text-slate-500 dark:border-slate-700">Your title is H1. Use ## for sections and ### for subsections. Tables, fenced code, and $inline$ or $$display$$ equations are supported. Review AI-generated claims and links before publishing.</p>
      </section>
      <aside className="space-y-4" aria-label="Publishing details">
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-semibold">{form.status} · {dirty ? 'Unsaved changes' : 'Saved'}</p>
          <label className="block text-sm font-medium">Summary<textarea name="excerpt" value={form.excerpt} onChange={change} maxLength={200} rows={3} className={inputClass} placeholder="Used on cards and search previews. Leave blank to generate from the article." /></label>
          <label className="block text-sm font-medium">Author<input name="author" value={form.author} onChange={change} maxLength={100} className={inputClass} /></label>
          <label className="block text-sm font-medium">Author type<select name="authorType" value={form.authorType} onChange={change} className={inputClass}><option value="Person">Individual</option><option value="Organization">Organization / team</option></select></label>
          <label className="block text-sm font-medium">Category<input name="category" value={form.category} onChange={change} maxLength={60} className={inputClass} /></label>
          <label className="block text-sm font-medium">Tags<input name="tags" value={Array.isArray(form.tags) ? form.tags.join(', ') : form.tags} onChange={change} className={inputClass} placeholder="PDF, tutorials, productivity" /></label>
          <p className="text-xs text-slate-500">Comma-separated, up to 10 tags.</p>
          {form.coverImage && <img src={form.coverThumbnail || form.coverImage} alt={form.coverAlt || 'Featured image preview'} className="aspect-video w-full rounded-lg object-cover" />}
          <label className="block text-sm font-medium">Featured image<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={event => upload(event)} className="mt-2 block w-full text-xs" /></label>
          <p className="text-xs text-slate-500">JPEG, PNG, or WebP · up to 8 MB. Responsive WebP sizes are created automatically.</p>
          <label className="block text-sm font-medium">Image description<input name="coverAlt" value={form.coverAlt} onChange={change} maxLength={250} className={inputClass} placeholder="Describe what the picture shows" /></label>
          {form.coverImage && <button type="button" onClick={() => setForm(current => ({ ...current, coverImage: '', coverThumbnail: '', coverWidth: 0, coverHeight: 0, coverThumbnailWidth: 0, coverAlt: '' }))} className="min-h-11 text-sm font-semibold text-red-700 dark:text-red-300">Remove featured image</button>}
          <button type="button" disabled={saving || uploading || loading || !saved} onClick={() => save('draft')} className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-50 dark:border-slate-600">{saving ? 'Saving…' : 'Save draft'}</button>
          <button type="button" disabled={saving || uploading || loading || !saved} onClick={() => save('published')} className="min-h-11 w-full rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{form.status === 'published' ? 'Update published article' : 'Publish article'}</button>
          {slug && form.status !== 'archived' && <button type="button" disabled={saving || uploading} onClick={() => { if (window.confirm('Archive this article? It will be removed from the public blog.')) save('archived'); }} className="min-h-11 w-full text-sm text-slate-600 dark:text-slate-300">Archive article</button>}
          {slug && <p className="break-all text-xs text-slate-500">URL: /blog/{slug}. Changing the title keeps this address.</p>}
          <p className="text-xs leading-5 text-slate-500">Save draft stores the article on the server and removes it from the public blog. An unsaved recovery copy stays in this browser tab.</p>
        </div>
      </aside>
    </div>
  </div>;
}
