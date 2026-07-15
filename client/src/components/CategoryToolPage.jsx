import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import ToolCard from "./ToolCard";
import SEO from "../utils/SEO";
import { primaryTools } from "../data/tools.jsx";

const CategoryToolPage = ({ seoData, badge, badgeClassName, icon, title, accent, description, category }) => {
  const tools = primaryTools.filter((tool) => tool.category === category);

  return (
    <div className="pb-20">
      <SEO seoData={seoData} />

      <section className="border-b border-slate-200 bg-slate-50/80 py-12 dark:border-slate-800 dark:bg-slate-950/30 md:py-16">
        <div className="mx-auto max-w-5xl px-4 text-left">
        <div className={`mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${badgeClassName}`}>
          <span className="material-icons text-xs">{icon}</span>
          {badge}
        </div>
          <h1 className="mb-4 text-4xl font-black leading-tight text-slate-950 dark:text-white md:text-6xl">
          {title} {accent}
        </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-400">
          {description}
        </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <h2 className="text-xl font-black text-slate-950 dark:text-white">Available tools</h2>
          <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-500 dark:border-slate-800">
            {tools.length} {tools.length === 1 ? "tool" : "tools"}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
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

        <div className="mt-12 text-center">
          <Link to="/tools" className="inline-flex items-center justify-center gap-2 text-sm font-black uppercase tracking-wide text-slate-500 transition-colors hover:text-teal-700 dark:hover:text-teal-300">
            <span className="material-icons text-sm">west</span>
            Back to all tools
          </Link>
        </div>
      </div>
    </div>
  );
};

CategoryToolPage.propTypes = {
  seoData: PropTypes.object.isRequired,
  badge: PropTypes.string.isRequired,
  badgeClassName: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  accent: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  category: PropTypes.string.isRequired,
};

export default CategoryToolPage;
