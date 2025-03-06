import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { SiJsonwebtokens } from "react-icons/si";
import { BiCodeBlock } from "react-icons/bi";
import { FaCode, FaCompressAlt } from "react-icons/fa";

const DevTools = () => {
  const tools = [
    { 
      title: "JSON Formatter", 
      link: "/tools/json-formatter", 
      icon: <SiJsonwebtokens className="text-white text-4xl" />, 
      color: "bg-blue-500" 
    },
    { 
      title: "Base64 Encoder/Decoder", 
      link: "/tools/base64-encoder", 
      icon: <BiCodeBlock className="text-white text-4xl" />, 
      color: "bg-purple-500" 
    },
    { 
      title: "URL Encoder/Decoder", 
      link: "/tools/url-encoder", 
      icon: <FaCode className="text-white text-4xl" />, 
      color: "bg-yellow-500" 
    },
    { 
      title: "Minify & Beautify Code", 
      link: "/tools/minify-beautify", 
      icon: <FaCompressAlt className="text-white text-4xl" />, 
      color: "bg-green-500" 
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* ============================
          🟢 SEO with react-helmet-async
      ============================ */}
      <Helmet>
        <title>Free Developer Tools | JSON Formatter, Minify Code, Encoder</title>
        <meta name="description" content="Use free online developer tools like JSON Formatter, Minifier, Base64 Encoder, and URL Encoder to format, minify, and optimize your code effortlessly." />
        <meta name="keywords" content="free developer tools, JSON formatter, minify code online, Base64 encoder, URL encoder, beautify code, optimize JavaScript, format JSON online" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="My Converter Tool" />
      </Helmet>

      {/* ============================
          🛠️ Developer Tools Showcase
      ============================ */}
      <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 text-center">
        Free Developer Tools 🛠
      </h1>
      <p className="text-center text-gray-600 dark:text-gray-300 mt-2">
        Use free online tools for developers to format, minify, encode, and beautify your code effortlessly.
      </p>

      {/* Colorful Cards with Icons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {tools.map((tool, index) => (
          <Link 
            key={index} 
            to={tool.link} 
            className={`flex items-center space-x-4 p-6 rounded-lg shadow-md transition-transform transform hover:scale-105 hover:shadow-xl text-white ${tool.color}`}
          >
            <div>{tool.icon}</div>
            <h3 className="text-lg font-bold">{tool.title}</h3>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DevTools;
