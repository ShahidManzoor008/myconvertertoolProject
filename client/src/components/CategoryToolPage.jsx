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

      <section className="text-center py-12 md:py-16" data-aos="fade-down">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border mb-6 ${badgeClassName}`}>
          <span className="material-icons text-xs">{icon}</span>
          {badge}
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight text-slate-900 dark:text-white">
          {title} <span className="gradient-text">{accent}</span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
          {description}
        </p>
      </section>

      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
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

        <div className="mt-20 text-center">
          <Link to="/tools" className="text-sm font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
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
