import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { memo } from "react";

const colorClasses = {
  blue: {
    icon: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900",
    accent: "group-hover:border-blue-500/70 group-hover:text-blue-700 dark:group-hover:text-blue-300",
  },
  green: {
    icon: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900",
    accent: "group-hover:border-emerald-500/70 group-hover:text-emerald-700 dark:group-hover:text-emerald-300",
  },
  yellow: {
    icon: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
    accent: "group-hover:border-amber-500/70 group-hover:text-amber-700 dark:group-hover:text-amber-300",
  },
  pink: {
    icon: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900",
    accent: "group-hover:border-rose-500/70 group-hover:text-rose-700 dark:group-hover:text-rose-300",
  },
  purple: {
    icon: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-900",
    accent: "group-hover:border-violet-500/70 group-hover:text-violet-700 dark:group-hover:text-violet-300",
  },
  indigo: {
    icon: "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-900",
    accent: "group-hover:border-indigo-500/70 group-hover:text-indigo-700 dark:group-hover:text-indigo-300",
  },
  red: {
    icon: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900",
    accent: "group-hover:border-red-500/70 group-hover:text-red-700 dark:group-hover:text-red-300",
  },
  teal: {
    icon: "bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:ring-teal-900",
    accent: "group-hover:border-teal-500/70 group-hover:text-teal-700 dark:group-hover:text-teal-300",
  },
};

const ToolCard = ({ title, link, icon, color, description, category }) => {
  const classes = colorClasses[color] || colorClasses.blue;

  return (
    <div className="group relative h-full">
      <Link
        to={link}
        className={`tool-card block h-full rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 ${classes.accent}`}
      >
        <div className="flex h-full flex-col">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${classes.icon}`}>
              <span className="text-xl">{icon}</span>
            </div>
            <span aria-hidden="true" className="material-icons text-lg text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">north_east</span>
          </div>
          {category && <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{category}</p>}
          <h3 className="mb-2 text-base font-bold leading-snug text-slate-950 dark:text-white">
            {title}
          </h3>
          <p className="min-h-12 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
            {description || "Open this free online utility."}
          </p>
          <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs font-bold text-blue-700 dark:border-slate-800 dark:text-blue-300">
            Open tool
            <span aria-hidden="true" className="material-icons text-base transition-transform group-hover:translate-x-1">east</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

ToolCard.propTypes = {
  title: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  color: PropTypes.string.isRequired,
  description: PropTypes.string,
  category: PropTypes.string,
};

export default memo(ToolCard);
