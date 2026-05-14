import { Link } from "react-router-dom";
import SEO from "../../utils/SEO";
import { SiJsonwebtokens } from "react-icons/si";
import { BiCodeBlock } from "react-icons/bi";
import { FaCode, FaCompressAlt } from "react-icons/fa";
import { motion } from "framer-motion";
import ToolCard from "../../components/ToolCard";

const DevTools = () => {
  const tools = [
    { 
      name: "JSON Formatter", 
      path: "/tools/json-formatter", 
      icon: <SiJsonwebtokens />, 
      color: "blue" 
    },
    { 
      name: "Base64 Tool", 
      path: "/tools/base64-encoder", 
      icon: <BiCodeBlock />, 
      color: "purple" 
    },
    { 
      name: "URL Tool", 
      path: "/tools/url-encoder", 
      icon: <FaCode />, 
      color: "yellow" 
    },
    { 
      name: "Code Optimizer", 
      path: "/tools/minify-beautify", 
      icon: <FaCompressAlt />, 
      color: "pink" 
    },
  ];

  return (
    <div className="pb-20">
      <SEO 
        seoData={{
          title: 'Developer Utilities Pro - Professional Code Tools',
          description: 'Access a suite of professional developer tools including JSON formatting, minification, and secure encoding.',
          keywords: 'developer tools, json formatter, code optimizer, b64, url encode',
          canonicalUrl: '/tools/dev',
          ogType: 'website',
        }}
      />

      {/* Header */}
      <section className="text-center py-12 md:py-16" data-aos="fade-down">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-600/20 mb-6">
          <span className="material-icons text-xs">terminal</span>
          Engineering Suite
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 leading-tight text-slate-900 dark:text-white">
          Developer <span className="gradient-text">Utilities</span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed font-medium">
          Professional-grade tools for code optimization, data formatting, and transformation.
        </p>
      </section>

      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
          {tools.map((tool, index) => (
            <ToolCard 
              key={index} 
              title={tool.name}
              link={tool.path}
              icon={tool.icon}
              color={tool.color}
            />
          ))}
        </div>
        
        <div className="mt-20 text-center">
          <Link to="/tools" className="text-sm font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
            <span className="material-icons text-sm">west</span>
            Back to all categories
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DevTools;
