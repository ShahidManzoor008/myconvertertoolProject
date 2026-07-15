import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { primaryTools } from "../data/tools.jsx";
import ToolCard from "../components/ToolCard";
import BlogCard from "../components/BlogCard.jsx";
import SEO from "../utils/SEO.jsx";
import { seoData } from "../utils/seoData";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { blogApi } from "../utils/apiClient";

const popularToolNames = [
  "PDF Converter",
  "Markdown to DOCX",
  "Word & Character Counter",
  "QR Code Generator",
  "JSON Formatter",
  "Base64 Encoder/Decoder",
  "URL Encoder/Decoder",
  "Minify & Beautify Code",
  "Text Case Converter",
];

const popularTools = primaryTools.filter((tool) => popularToolNames.includes(tool.name));

const categoryHighlights = [
  {
    title: "PDF Tools",
    link: "/tools/pdf-converter",
    description: "Convert, merge, split, compress, and prepare documents.",
    color: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300",
  },
  {
    title: "Developer Tools",
    link: "/tools/dev",
    description: "Format JSON, encode data, clean code, and debug text.",
    color: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300",
  },
  {
    title: "Text Tools",
    link: "/tools/text",
    description: "Count, transform, and export written content.",
    color: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300",
  },
  {
    title: "Marketing Tools",
    link: "/tools/seo",
    description: "Create QR codes and campaign-ready sharing assets.",
    color: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300",
  },
];

const Home = () => {
  const [latestPosts, setLatestPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const matchingTools = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return popularTools.slice(0, 4);
    }

    return primaryTools
      .filter((tool) => {
        const haystack = [
          tool.name,
          tool.category,
          tool.description,
          ...(tool.keywords || []),
        ].join(" ").toLowerCase();

        return haystack.includes(query);
      })
      .slice(0, 6);
  }, [searchQuery]);

  useEffect(() => {
    const fetchLatestPosts = async () => {
      try {
        setLoading(true);
        const data = await blogApi.getPosts({ limit: 3 });
        setLatestPosts(data.posts || []);
      } catch (err) {
        console.error("Error fetching latest posts:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestPosts();
  }, []);

  return (
    <div className="pb-20">
      <SEO
        title={seoData.home.title}
        description={seoData.home.description}
        keywords={seoData.home.keywords}
        canonicalUrl={seoData.home.canonicalUrl}
        ogType={seoData.home.ogType}
        jsonLd={seoData.home.jsonLd}
      />

      <section className="border-b border-slate-200 bg-slate-50/80 pt-20 pb-14 dark:border-slate-800 dark:bg-slate-950/30">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div>
          <div
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-bold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Free browser-based utilities
          </div>

            <h1 className="mb-6 max-w-4xl text-4xl font-black leading-tight text-slate-950 dark:text-white md:text-6xl">
            Free Online PDF, Text, SEO & Developer Tools
          </h1>

            <p className="mb-8 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-400">
            Convert PDFs, format JSON, generate QR codes, encode data, and clean up text with fast online tools built for daily work.
          </p>

            <div className="mb-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/tools" className="btn-primary w-full px-6 py-3 sm:w-auto">
                Browse All Tools
              </Link>
              <Link to="/tools/word-counter" className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 font-bold text-slate-800 transition hover:border-teal-500 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:w-auto">
                Word Counter
                <span className="material-icons text-base">east</span>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 text-left">
              <HeroStat value={primaryTools.length} label="Live tools" />
              <HeroStat value="No signup" label="Most tools" />
              <HeroStat value="Fast" label="Browser first" />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <label htmlFor="tool-search" className="sr-only">Search tools</label>
            <div className="relative">
              <span className="material-icons absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                id="tool-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search PDF, JSON, QR, Base64, text tools..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-4 pl-14 pr-5 text-base font-semibold outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-950"
              />
            </div>

              <div className="mt-4 grid grid-cols-1 gap-3 text-left">
              {matchingTools.length > 0 ? (
                matchingTools.map((tool) => (
                  <Link
                    key={tool.path}
                    to={tool.path}
                      className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-teal-500 hover:text-teal-700 dark:border-slate-800 dark:text-slate-200 dark:hover:text-teal-300"
                  >
                    <span>{tool.name}</span>
                    <span className="material-icons text-base">east</span>
                  </Link>
                ))
              ) : (
                  <div className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500 dark:border-slate-800">
                  No matching tools found.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="section-title mb-2">Browse by Category</h2>
            <p className="text-slate-600 dark:text-slate-400">Find the right utility by task type and get to work quickly.</p>
          </div>
          <Link to="/tools" className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-600 transition hover:text-teal-700 dark:text-slate-300">
            View directory <span className="material-icons text-base">east</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categoryHighlights.map((category) => (
            <Link key={category.title} to={category.link} className={`rounded-lg border p-5 transition hover:-translate-y-0.5 hover:shadow-md ${category.color}`}>
              <h3 className="mb-2 text-lg font-black">{category.title}</h3>
              <p className="text-sm leading-6 opacity-85">{category.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="text-left">
            <h2 className="section-title mb-2">Popular Tools</h2>
            <p className="text-slate-600 dark:text-slate-400">Fast utilities for common document, data, and text tasks.</p>
          </div>
          <Link to="/tools" className="flex items-center gap-2 font-bold text-teal-700 transition-all hover:gap-3 dark:text-teal-300">
            See all tools <span className="material-icons">east</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {popularTools.map((tool) => (
            <ToolCard
              key={tool.path}
              title={tool.name}
              link={tool.path}
              icon={tool.icon}
              color={tool.color}
              description={tool.description}
            />
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-20 dark:border-slate-800 dark:bg-slate-950/30">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 text-center">
            <h2 className="section-title">Insights & Guides</h2>
            <p className="mx-auto max-w-xl text-slate-600 dark:text-slate-400">Learn practical ways to work faster with file, text, SEO, and developer utilities.</p>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 py-10 text-center text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              <p className="font-bold">Error loading posts: {error}</p>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner message="Curating latest articles..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {latestPosts && latestPosts.map((post) => (
                <BlogCard key={post._id} post={post} />
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link to="/blog" className="btn-primary inline-flex">
              Read More on Blog
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

const HeroStat = ({ value, label }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <p className="text-xl font-black text-slate-950 dark:text-white">{value}</p>
    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
  </div>
);

HeroStat.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
};

export default Home;
