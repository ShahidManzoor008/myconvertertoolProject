import ToolCard from "../components/ToolCard";
import SEO from "../utils/SEO.jsx";
import { primaryTools } from "../data/tools.jsx";

const sections = [
  {
    title: "PDF Management",
    subtitle: "Convert, edit, and organize PDF documents.",
    category: "PDF Tools",
  },
  {
    title: "Developer Utilities",
    subtitle: "Format code, encode data, and clean up web assets.",
    category: "Dev Tools",
  },
  {
    title: "Text Processing",
    subtitle: "Transform text, documents, and written content.",
    category: "Text Tools",
  },
  {
    title: "SEO & Marketing",
    subtitle: "Create assets and previews for search, sharing, and campaigns.",
    category: "SEO Tools",
  },
];

const Tools = () => {
  const seoData = {
    title: "Free Online Tools | PDF, Developer, Text & SEO Tools - MyConverterTool",
    description: "Access free online tools for PDFs, JSON formatting, QR code generation, Base64 encoding, URL encoding, text conversion, and more.",
    keywords: "online tools, developer tools, PDF tools, JSON formatter, QR code generator, text converter, base64 encoder",
    canonicalUrl: "/tools",
    ogType: "website",
  };

  return (
    <div className="pb-20">
      <SEO seoData={seoData} />

      <section className="text-center py-16 md:py-24" data-aos="zoom-in">
        <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
          Free Online <span className="gradient-text">Tools</span>
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
          Fast browser-based utilities for PDFs, text, SEO tasks, and developer workflows.
        </p>
      </section>

      <div className="container mx-auto px-4 space-y-20">
        {sections.map((section) => {
          const sectionTools = primaryTools.filter((tool) => tool.category === section.category);

          return (
            <ToolSection key={section.category} title={section.title} subtitle={section.subtitle}>
              {sectionTools.map((tool) => (
                <ToolCard
                  key={tool.path}
                  title={tool.name}
                  link={tool.path}
                  icon={tool.icon}
                  color={tool.color}
                  description={tool.description}
                />
              ))}
            </ToolSection>
          );
        })}
      </div>
    </div>
  );
};

const ToolSection = ({ title, subtitle, children }) => {
  return (
    <section data-aos="fade-up">
      <div className="mb-10 border-l-4 border-blue-600 pl-6">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2 uppercase">
          {title}
        </h2>
        {subtitle && <p className="text-slate-500 font-medium">{subtitle}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {children}
      </div>
    </section>
  );
};

export default Tools;
