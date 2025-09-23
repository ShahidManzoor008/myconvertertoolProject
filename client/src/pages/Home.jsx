import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect, useState } from "react"; // Added useState
import { tools } from "../data/tools.jsx";
import CategoryCard from "../components/CategoryCard";
import ToolCard from "../components/ToolCard";
import BlogCard from "../components/BlogCard.jsx"; // Ensure correct import path
import SEO from "../utils/SEO.jsx";
import { seoData } from "../utils/seoData";
import LoadingSpinner from "../components/LoadingSpinner.jsx"; // Import LoadingSpinner

const popularToolNames = [
  "PDF Tools",
  "Markdown to DOCX",
  "QR Code Generator",
  "JSON Formatter",
  "Base64 Encoder/Decoder",
  "URL Encoder/Decoder",
  "Minify & Beautify Code",
  "Text Case Converter",
];

const popularTools = tools.filter(tool => popularToolNames.includes(tool.name));

const Home = () => {
  const [latestPosts, setLatestPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    AOS.init({ duration: 1000 });

    const fetchLatestPosts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/blog/posts?limit=4`); // Fetch latest 4 posts
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch latest blog posts');
        }

        setLatestPosts(data.posts);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestPosts();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4"
    >
      <SEO
        title={seoData.home.title}
        description={seoData.home.description}
        keywords={seoData.home.keywords}
        jsonLd={seoData.home.jsonLd}
      />
      {/* Hero Section */}
      <section className="text-center py-16 md:py-20" data-aos="fade-up">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400 leading-tight">
          Welcome to My Converter Tools 🚀
        </h1>
        <p className="mt-4 text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
          Free Developer & Productivity Tools
        </p>
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
          className="inline-block mt-8"
        >
          <Link
            to="/tools"
            className="bg-blue-500 text-white px-8 py-4 rounded-lg transition duration-300 transform hover:scale-105 hover:bg-blue-600 shadow-lg text-lg font-semibold"
          >
            Explore Tools 🚀
          </Link>
        </motion.div>
      </section>
      {/* Tool Categories */}
      <section className="mt-16 md:mt-20" data-aos="fade-up">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 text-center">
          Tool Categories
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 mt-8">
          <CategoryCard
            title="Dev Tools"
            link="/tools/dev"
            color="blue"
          />
          <CategoryCard
            title="Text Tools"
            link="/tools/text"
            color="green"
          />
          <CategoryCard
            title="SEO Tools"
            link="/tools/seo"
            color="yellow"
          />
          <CategoryCard
            title="PDF Tools"
            link="/tools/pdf-converter"
            color="pink"
          />
        </div>
      </section>
      {/* 📢 AdSense Ad */}
      {/* <AdSenseAd adSlot="XXXXXXXXXX" layout="in-article" /> */}
      {/* Popular Tools */}
      <section className="mt-16 md:mt-20" data-aos="fade-up">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 text-center">
          Popular Tools🔥
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {popularTools.map((tool, index) => (
            <ToolCard
              key={index}
              title={tool.name}
              link={tool.path}
              icon={tool.icon}
              color={tool.color}
            />
          ))}
        </div>
      </section>
      {/* ✅ Latest Blog Posts Section */}
      <section className="mt-16 md:mt-20" data-aos="fade-up">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 text-center">
          Latest Blog Posts
        </h2>

        {error ? (
          <div className="text-center text-red-600 dark:text-red-400">
            <h2 className="text-2xl font-semibold mb-4">Error</h2>
            <p>{error}</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
            {latestPosts.map((post) => (
              <BlogCard
                key={post._id}
                post={post}
              />
            ))}
          </div>
        )}

        {/* ✅ View All Button */}
        <div className="mt-10 text-center">
          <Link
            to="/blog"
            className="text-blue-600 dark:text-blue-400 hover:underline text-xl font-medium"
          >
            View All Posts →
          </Link>
        </div>
      </section>
    </motion.div>
  );
};

export default Home;