import { Link } from "react-router-dom";
import SEO from "../../utils/SEO";
import { TbTransform } from "react-icons/tb";
import { SiMarkdown } from "react-icons/si";
import ToolCard from "../../components/ToolCard";

const TextTools = () => {
  const tools = [
    { name: "Case Converter", path: "/tools/text-case-converter", icon: <TbTransform />, color: "green" },
    { name: "Markdown to DOCX", path: "/tools/markdown-to-docx", icon: <SiMarkdown />, color: "blue" },
  ];

  return (
    <div className="pb-20">
      <SEO 
        seoData={{
          title: 'Text Processing Pro - Content Transformation Suite',
          description: 'Refine, convert and transform your text-based content with our professional tools.',
          keywords: 'text converter, case converter, markdown to docx',
          canonicalUrl: '/tools/text',
          ogType: 'website',
        }}
      />

      <section className="text-center py-12 md:py-16" data-aos="fade-down">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-black uppercase tracking-widest border border-green-500/20 mb-6">
          <span className="material-icons text-xs">edit_note</span>
          Content Engine
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 leading-tight text-slate-900 dark:text-white">
          Text <span className="gradient-text">Utilities</span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed font-medium">
          Professional workspace for formatting, converting and perfecting your written content.
        </p>
      </section>

      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
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

export default TextTools;
