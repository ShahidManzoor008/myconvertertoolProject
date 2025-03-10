import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AOS from "aos";
import "aos/dist/aos.css";
import { Helmet } from "react-helmet-async";
// import AdSenseAd from "../components/AdSenseAd";
import { useEffect } from "react";
import {
  FaCode,
  FaQrcode,
  FaFilePdf,
  FaSortAlphaDown,
  FaDatabase,
  FaCompressAlt,
  FaExpandAlt,
} from "react-icons/fa";
import { AiOutlineFileWord } from "react-icons/ai";
import blogPosts from "../data/blogposts.json";
import blog1 from "../assets/blog1.webp";
import blog2 from "../assets/blog2.webp";
const blogImages = {
  "blog1.webp": blog1,
  "blog2.webp": blog2,
};

const Home = () => {
  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 max-w-5xl mx-auto"
    >
      <Helmet>
        {/* ✅ Title & Description */}
        <title>
          Free Online Developer & Productivity Tools - My Converter Tools
        </title>
        <meta
          name="description"
          content="Access 100% free online tools for developers, writers, and businesses. JSON Formatter,Free PDF Converter,Free SEO Tools, AI Utilities & more!"
        />

        {/* ✅ High-Ranking Keywords */}
        <meta
          name="keywords"
          content="free online tools, developer tools, JSON Formatter, Base64 Encoder, PDF Converter, AI tools, SEO tools, text tools, website tools, free file converters"
        />

        {/* ✅ Open Graph (Social Media) */}
        <meta
          property="og:title"
          content="Free Online Developer & Productivity Tools - My Converter Tools"
        />
        <meta
          property="og:description"
          content="Instantly access powerful free online tools for development, SEO, and productivity. No downloads, no sign-up!"
        />
        <meta property="og:url" content="https://myconvertertool.com" />
        <meta property="og:type" content="website" />
        <meta
          property="og:image"
          content="https://myconvertertool.com/static/home-preview.png"
        />

        {/* ✅ Twitter Card for Better Social Sharing */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Free Online Developer & Productivity Tools"
        />
        <meta
          name="twitter:description"
          content="Use free online tools like JSON Formatter, PDF Converter, AI Generators, SEO Tools & more at My Converter Tools!"
        />
        <meta
          name="twitter:image"
          content="https://myconvertertool.com/static/home-preview.png"
        />

        {/* ✅ Canonical Link */}
        <link rel="canonical" href="https://myconvertertool.com" />

        {/* ✅ Robots for Indexing */}
        <meta name="robots" content="index, follow" />
      </Helmet>
      {/* Hero Section */}
      <section className="text-center py-16" data-aos="fade-up">
        <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400">
          Welcome to My Converter Tools 🚀
        </h1>
        <p className="mt-4 text-gray-700 dark:text-gray-300">
          Free Developer & Productivity Tools
        </p>
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
          className="inline-block mt-6"
        >
          <Link
            to="/tools"
            className="bg-blue-500 text-white px-6 py-3 rounded-md transition duration-300 transform hover:scale-105 hover:bg-blue-600 shadow-lg"
          >
            Explore Tools 🚀
          </Link>
        </motion.div>
      </section>
      <section className="mt-10" data-aos="fade-up">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Tool Categories
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-6">
          <CategoryCard
            title="Dev Tools"
            link="/tools/dev"
            color="bg-blue-500"
          />
          <CategoryCard
            title="Text Tools"
            link="/tools/text"
            color="bg-green-500"
          />
          <CategoryCard
            title="SEO Tools"
            link="/tools/seo"
            color="bg-yellow-500"
          />
          <CategoryCard
            title="Electronics Tools"
            link="/tools/electronics"
            color="bg-purple-500"
          />
          <CategoryCard title="AI Tools" link="/tools/ai" color="bg-red-500" />
          <CategoryCard
            title="PDF Tools"
            link="/tools/pdf"
            color="bg-pink-500"
          />
        </div>
      </section>
      {/* 📢 AdSense Ad */}
      {/* <AdSenseAd adSlot="XXXXXXXXXX" layout="in-article" /> */}
      {/* Tool Categories */}
      {/* Popular Tools */}
      <section className="mt-10" data-aos="fade-up">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Popular Tools🔥
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <ToolCard
            title="PDF Converter"
            link="/tools/pdf-converter"
            icon={<FaFilePdf />}
            color="bg-red-500"
          />
          <ToolCard
            title="Markdown to DOCX Converter"
            link="/tools/markdown-to-docx"
            icon={<AiOutlineFileWord />}
            color="bg-blue-500"
          />
          <ToolCard
            title="QR Code Generator"
            link="/tools/qr-code-generator"
            icon={<FaQrcode />}
            color="bg-green-500"
          />
          <ToolCard
            title="JSON Formatter"
            link="/tools/json-formatter"
            icon={<FaCode />}
            color="bg-blue-500"
          />
          <ToolCard
            title="Base64 Encoder/Decoder"
            link="/tools/base64-encoder"
            icon={<FaDatabase />}
            color="bg-yellow-500"
          />
          <ToolCard
            title="URL Encoder/Decoder"
            link="/tools/url-encoder"
            icon={<FaExpandAlt />}
            color="bg-pink-500"
          />

          <ToolCard
            title="Minify & Beautify Code"
            link="/tools/minify-beautify"
            icon={<FaCompressAlt />}
            color="bg-indigo-500"
          />

          <ToolCard
            title="Text Case Converter"
            link="/tools/text-case-converter"
            icon={<FaSortAlphaDown />}
            color="bg-purple-500"
          />
        </div>
      </section>
      <div className="p-6 max-w-6xl mx-auto">
        {/* ✅ Latest Blog Posts Section */}
        <section className="mt-10" data-aos="fade-up">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Latest Blog Posts
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {blogPosts.slice(0, 2).map((post) => (
              <BlogCard
                key={post.id}
                title={post.title}
                link={`/blog/${post.id}`}
                excerpt={post.excerpt}
                image={blogImages[post.image]} // ✅ Load Local Image
              />
            ))}
          </div>

          {/* ✅ View All Button */}
          <div className="mt-6 text-center">
            <Link
              to="/blog"
              className="text-blue-600 dark:text-blue-400 hover:underline text-lg"
            >
              View All Posts →
            </Link>
          </div>
        </section>
      </div>
    </motion.div>
  );
};

// Category Card Component
const CategoryCard = ({ title, link, color }) => {
  return (
    <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }}>
      <Link
        to={link}
        className={`block p-6 ${color} text-white rounded-md text-center shadow-lg transition-transform duration-300 transform hover:shadow-2xl`}
      >
        <h3 className="text-lg font-bold">{title}</h3>
      </Link>
    </motion.div>
  );
};
// Tool Card Component
const ToolCard = ({ title, link, icon, color }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`p-6 ${color} text-white rounded-lg text-center shadow-md hover:shadow-2xl transition-transform transform hover:scale-105`}
    >
      <Link to={link} className="flex flex-col items-center">
        <span className="text-4xl">{icon}</span>
        <h3 className="text-lg font-bold mt-2">{title}</h3>
      </Link>
    </motion.div>
  );
};
// ✅ Reusable Blog Card Component
const BlogCard = ({ title, link, excerpt, image }) => {
  return (
    <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }}>
      <Link
        to={link}
        className="block bg-white dark:bg-gray-800 rounded-md shadow-md border border-gray-200 dark:border-gray-700 transition duration-300 hover:shadow-xl overflow-hidden"
      >
        {/* ✅ Blog Image (Lazy Loading for Better Performance) */}
        <div className="h-40 bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy" // ✅ Improves Performance
          />
        </div>

        {/* ✅ Blog Content */}
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            {title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
            {excerpt}
          </p>
          <span className="text-blue-500 dark:text-blue-400 mt-4 inline-block font-medium">
            Read More →
          </span>
        </div>
      </Link>
    </motion.div>
  );
};
export default Home;
