import { Link } from "react-router-dom";
import SEO from "../../utils/SEO";
import { BsQrCode } from "react-icons/bs";
import ToolCard from "../../components/ToolCard";

const SeoTools = () => {
  const tools = [
    { name: "QR Generator", path: "/tools/qr-code-generator", icon: <BsQrCode />, color: "teal" },
  ];

  return (
    <div className="pb-20">
      <SEO 
        seoData={{
          title: 'SEO & Marketing Tools - Growth Suite',
          description: 'Improve your digital presence with our suite of free SEO and marketing utilities.',
          keywords: 'seo tools, qr generator, marketing utilities',
          canonicalUrl: '/tools/seo',
          ogType: 'website',
        }}
      />

      <section className="text-center py-12 md:py-16" data-aos="fade-down">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-[10px] font-black uppercase tracking-widest border border-yellow-500/20 mb-6">
          <span className="material-icons text-xs">public</span>
          Growth Engine
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 leading-tight text-slate-900 dark:text-white">
          SEO <span className="gradient-text">Utilities</span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed font-medium">
          Powerful tools designed to enhance your digital footprint and connectivity.
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

export default SeoTools;
