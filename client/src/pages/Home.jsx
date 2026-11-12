import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Search, FileText, Code2, Type, ScanLine, Check, X } from 'lucide-react';
import { primaryTools } from '../data/tools.jsx';
import ToolCard from '../components/ToolCard';
import BlogCard from '../components/BlogCard.jsx';
import SEO from '../utils/SEO.jsx';
import { seoData } from '../utils/seoData';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { blogApi } from '../utils/apiClient';

const categories = [
  { name: 'PDF Tools', label: 'Documents', title: 'PDF & documents', path: '/tools/pdf-converter', icon: FileText, description: 'Convert, combine, and prepare your files.', color: 'red' },
  { name: 'Dev Tools', label: 'Developer', title: 'Developer tools', path: '/tools/dev', icon: Code2, description: 'Make sense of data and clean up your code.', color: 'blue' },
  { name: 'Text Tools', label: 'Text', title: 'Writing & text', path: '/tools/text', icon: Type, description: 'Count, transform, and export your words.', color: 'green' },
  { name: 'SEO Tools', label: 'SEO & sharing', title: 'SEO & sharing', path: '/tools/seo', icon: ScanLine, description: 'Preview search results and create QR codes.', color: 'yellow' },
];

const Home = () => {
  const [latestPosts, setLatestPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const matchingTools = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return primaryTools.filter(tool =>
      (selectedCategory === 'all' || tool.category === selectedCategory)
      && [tool.name, tool.category, tool.description, ...(tool.keywords || [])].join(' ').toLowerCase().includes(query)
    );
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    let active = true;
    blogApi.getPosts({ limit: 3 })
      .then(data => { if (active) setLatestPosts(data.posts || []); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="home-page pb-12">
      <SEO {...seoData.home} />

      <section className="home-hero mt-4 sm:mt-6" aria-labelledby="home-heading">
        <div className="relative grid items-center gap-8 px-5 py-8 sm:px-9 sm:py-10 lg:grid-cols-[1.25fr_1fr] lg:gap-14 lg:px-12 lg:py-12">
          <div>
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-bold text-blue-700 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-300">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> A little less busywork
            </span>
            <h1 id="home-heading" className="max-w-xl text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
              Everyday tools.<br /><span className="text-blue-600 dark:text-blue-400">Ready when you are.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
              Convert a document, tidy your code, or work with text. Pick a tool and get straight to work.
            </p>
            <div className="home-actions mt-7 flex flex-wrap items-center gap-3">
              <a href="#all-tools" className="btn-primary rounded-xl px-5">Find your tool <ArrowRight size={17} /></a>
              <Link to="/tools/pdf-converter" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-blue-400 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                Convert to PDF
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              {['Free to use', `${primaryTools.length} focused tools`, 'No installation'].map(label => <span key={label} className="inline-flex items-center gap-1.5"><Check size={14} className="text-blue-600 dark:text-blue-400" />{label}</span>)}
            </div>
          </div>

          <div className="home-quickstart rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">What are you working on?</h2>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">Quick start</span>
            </div>
            <div className="space-y-3">
              {[
                { title: 'A document to convert', detail: 'Word, images, Markdown → PDF', path: '/tools/pdf-converter', icon: FileText, color: 'text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-300' },
                { title: 'Notes to turn into Word', detail: 'Markdown → DOCX, with equations', path: '/tools/markdown-to-docx', icon: Type, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300' },
                { title: 'Data to clean up', detail: 'Format and validate your JSON', path: '/tools/json-formatter', icon: Code2, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300' },
              ].map(({ title, detail, path, icon: Icon, color }) => (
                <Link key={path} to={path} className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-blue-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-blue-700 dark:hover:bg-slate-800/60">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}><Icon size={20} /></span>
                  <span className="flex-1"><span className="block text-sm font-bold text-slate-900 dark:text-white">{title}</span><span className="mt-0.5 block text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</span></span>
                  <ArrowRight aria-hidden="true" size={16} className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
            <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400">Choose a tool. Add your files or text. Get your result.</p>
          </div>
        </div>
      </section>

      <section id="all-tools" aria-labelledby="tools-heading" className="scroll-mt-4 py-10 sm:py-14">
        <div className="mb-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Your everyday toolkit</p>
            <h2 id="tools-heading" className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Find the right tool</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">Everything you need, one click away.</p>
          </div>
          <div className="relative w-full lg:max-w-sm">
            <label htmlFor="tool-search" className="sr-only">Search tools</label>
            <Search aria-hidden="true" size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input id="tool-search" type="search" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search tools, formats, or tasks…" className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
          </div>
        </div>
        <div className="mb-6 flex flex-wrap items-center gap-2" role="group" aria-label="Filter tools by category">
          {[{ name: 'all', label: 'All tools' }, ...categories].map(category => (
            <button key={category.name} type="button" aria-pressed={selectedCategory === category.name} onClick={() => setSelectedCategory(category.name)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${selectedCategory === category.name ? 'border-blue-600 bg-blue-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-600'}`}>{category.label}</button>
          ))}
          <span role="status" className="ml-auto text-xs text-slate-500 dark:text-slate-400">{matchingTools.length} {matchingTools.length === 1 ? 'tool' : 'tools'}</span>
        </div>
        {matchingTools.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {matchingTools.map(tool => <ToolCard key={tool.path} title={tool.name} link={tool.path} icon={tool.icon} color={tool.color} description={tool.description} category={tool.category} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <Search size={28} className="mx-auto mb-3 text-slate-400" />
            <h3 className="font-bold text-slate-900 dark:text-white">No tools match your search</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Try another term or clear your filters to see all tools.</p>
            <button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} className="mx-auto mt-5 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-blue-700 dark:text-blue-300"><X size={16} /> Clear filters</button>
          </div>
        )}
      </section>

      <section aria-labelledby="categories-heading" className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/40 sm:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div><h2 id="categories-heading" className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">Explore by category</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-400">More ways to find what you need.</p></div>
          <Link to="/tools" className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 dark:text-blue-300">View directory <ArrowRight size={16} /></Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map(({ title, path, icon: Icon, description, color }) => (
            <Link key={path} to={path} className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-600">
              <div className="mb-4 flex items-center justify-between"><Icon size={22} className={{ red: 'text-red-600 dark:text-red-400', blue: 'text-blue-600 dark:text-blue-400', green: 'text-emerald-600 dark:text-emerald-400', yellow: 'text-amber-600 dark:text-amber-400' }[color]} /><ArrowRight size={16} aria-hidden="true" className="text-slate-400 transition-transform group-hover:translate-x-1" /></div>
              <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="guides-heading" className="pt-12 sm:pt-16">
        <div className="mb-7 flex items-end justify-between gap-4"><div><p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Make the most of your tools</p><h2 id="guides-heading" className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">Tips & practical guides</h2></div><Link to="/blog" className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-blue-700 dark:text-blue-300">All guides <ArrowRight size={16} /></Link></div>
        {loading ? <div className="flex justify-center py-10"><LoadingSpinner message="Loading guides…" /></div> : error ? <p className="rounded-xl border border-slate-200 p-6 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">Guides are unavailable right now. You can still use all the tools above.</p> : latestPosts.length === 0 ? <p className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">Explore our blog for step-by-step guides and practical tips.</p> : <div className="grid gap-6 md:grid-cols-3">{latestPosts.map(post => <BlogCard key={post._id} post={post} />)}</div>}
      </section>
    </div>
  );
};

export default Home;
