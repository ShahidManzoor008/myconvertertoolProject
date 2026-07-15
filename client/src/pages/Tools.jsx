import ToolCard from "../components/ToolCard";
import SEO from "../utils/SEO.jsx";
import { primaryTools } from "../data/tools.jsx";
import PropTypes from "prop-types";

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

      <section className="border-b border-slate-200 bg-slate-50/80 py-16 dark:border-slate-800 dark:bg-slate-950/30 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-black uppercase tracking-wide text-teal-700 dark:text-teal-300">Tool directory</p>
            <h1 className="mb-5 text-4xl font-black leading-tight text-slate-950 dark:text-white md:text-6xl">
              Free Online Tools for Daily Work
        </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-400">
              A focused set of browser-based utilities for documents, development, writing, and sharing. No filler pages, just tools people can use.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-16">
        {sections.map((section) => {
          const sectionTools = primaryTools.filter((tool) => tool.category === section.category);

          if (!sectionTools.length) {
            return null;
          }

          return (
            <ToolSection key={section.category} title={section.title} subtitle={section.subtitle} count={sectionTools.length}>
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

const ToolSection = ({ title, subtitle, count, children }) => {
  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-950 dark:text-white">
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-slate-600 dark:text-slate-400">{subtitle}</p>}
        </div>
        <span className="w-fit rounded-full border border-slate-200 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-500 dark:border-slate-800">
          {count} {count === 1 ? "tool" : "tools"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {children}
      </div>
    </section>
  );
};

ToolSection.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  count: PropTypes.number.isRequired,
  children: PropTypes.node.isRequired,
};

export default Tools;
