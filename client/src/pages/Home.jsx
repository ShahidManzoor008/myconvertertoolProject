import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect, useMemo, useState } from "react";
import { primaryTools } from "../data/tools.jsx";
import CategoryCard from "../components/CategoryCard";
import ToolCard from "../components/ToolCard";
import BlogCard from "../components/BlogCard.jsx";
import SEO from "../utils/SEO.jsx";
import { seoData } from "../utils/seoData";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { blogApi } from "../utils/apiClient";

const popularToolNames = [
  "PDF Converter",
  "Markdown to DOCX",
  "QR Code Generator",
  "JSON Formatter",
  "Base64 Encoder/Decoder",
  "URL Encoder/Decoder",
  "Minify & Beautify Code",
  "Text Case Converter",
];

const popularTools = primaryTools.filter((tool) => popularToolNames.includes(tool.name));

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
    AOS.init({ duration: 800, once: true });

    const fetchLatestPosts = async () => {
      try {
        setLoading(true);
        const data = await blogApi.getPosts(1, 3);
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
    <div className="space-y-24 pb-20">
      <SEO
        title={seoData.home.title}
        description={seoData.home.description}
        keywords={seoData.home.keywords}
        jsonLd={seoData.home.jsonLd}
      />

      <section className="relative pt-20 pb-12 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <div className="text-center max-w-5xl mx-auto px-4" data-aos="zoom-out-up">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-bold mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            Free browser-based utilities
          </motion.div>

          <h1 className="text-4xl md:text-6xl font-black mb-8 leading-[1.1]">
            Free Online PDF, Text, SEO & Developer Tools
          </h1>

          <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            Convert PDFs, format JSON, generate QR codes, encode data, and clean up text with fast online tools built for daily work.
          </p>

          <div className="max-w-3xl mx-auto mb-10">
            <label htmlFor="tool-search" className="sr-only">Search tools</label>
            <div className="relative">
              <span className="material-icons absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                id="tool-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search PDF, JSON, QR, Base64, text tools..."
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 py-5 pl-14 pr-5 text-base font-semibold shadow-xl shadow-slate-200/60 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:shadow-slate-950/40"
              />
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {matchingTools.length > 0 ? (
                matchingTools.map((tool) => (
                  <Link
                    key={tool.path}
                    to={tool.path}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 transition hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <span>{tool.name}</span>
                    <span className="material-icons text-base">east</span>
                  </Link>
                ))
              ) : (
                <div className="sm:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 px-4 py-3 text-sm font-semibold text-slate-500">
                  No matching tools found.
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/tools" className="btn-primary w-full sm:w-auto text-lg px-10 py-4">
              Browse All Tools
            </Link>
            <Link to="/tools/pdf-converter" className="px-10 py-4 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors w-full sm:w-auto">
              Open PDF Converter
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4" data-aos="fade-up">
        <div className="text-center mb-16">
          <h2 className="section-title">Browse by Category</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Find the right utility by task type and get to work quickly.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <CategoryCard title="Dev Tools" link="/tools/dev" color="blue" />
          <CategoryCard title="Text Tools" link="/tools/text" color="green" />
          <CategoryCard title="SEO Tools" link="/tools/seo" color="yellow" />
          <CategoryCard title="PDF Tools" link="/tools/pdf-converter" color="pink" />
        </div>
      </section>

      <section className="container mx-auto px-4" data-aos="fade-up">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-4">
          <div className="text-left">
            <h2 className="section-title mb-2">Popular Tools</h2>
            <p className="text-slate-500">Fast utilities for common document, data, and text tasks.</p>
          </div>
          <Link to="/tools" className="text-blue-600 font-bold flex items-center gap-2 hover:gap-3 transition-all">
            See all tools <span className="material-icons">east</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <section className="bg-slate-50 dark:bg-slate-900/50 py-24 border-y border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4" data-aos="fade-up">
          <div className="text-center mb-16">
            <h2 className="section-title">Insights & Guides</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Learn practical ways to work faster with file, text, SEO, and developer utilities.</p>
          </div>

          {error ? (
            <div className="text-center text-red-600 py-12 glass rounded-2xl">
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

          <div className="mt-16 text-center">
            <Link to="/blog" className="btn-primary inline-flex bg-slate-900 dark:bg-white dark:text-slate-900 hover:opacity-90">
              Read More on Blog
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
