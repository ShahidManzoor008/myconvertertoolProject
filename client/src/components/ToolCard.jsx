import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { memo } from "react";

const colorClasses = {
  blue: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900",
  yellow: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
  pink: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900",
  purple: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-900",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-900",
  red: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900",
  teal: "bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:ring-teal-900",
};

const actionClasses = {
  blue: "border-blue-200 bg-blue-50 text-blue-800 hover:border-blue-400 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200 dark:hover:bg-blue-900/60",
  green: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200 dark:hover:bg-emerald-900/60",
  yellow: "border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-400 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200 dark:hover:bg-amber-900/60",
  pink: "border-rose-200 bg-rose-50 text-rose-800 hover:border-rose-400 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200 dark:hover:bg-rose-900/60",
  purple: "border-violet-200 bg-violet-50 text-violet-800 hover:border-violet-400 hover:bg-violet-100 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-200 dark:hover:bg-violet-900/60",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-800 hover:border-indigo-400 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200 dark:hover:bg-indigo-900/60",
  red: "border-red-200 bg-red-50 text-red-800 hover:border-red-400 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200 dark:hover:bg-red-900/60",
  teal: "border-teal-200 bg-teal-50 text-teal-800 hover:border-teal-400 hover:bg-teal-100 dark:border-teal-900 dark:bg-teal-950/50 dark:text-teal-200 dark:hover:bg-teal-900/60",
};

const cardClass = "tool-card group h-full rounded-xl border border-slate-200 bg-white transition-colors hover:border-blue-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:rounded-2xl sm:hover:shadow-md";

function CardContent({ title, icon, color, description, category }) {
  return <>
    <div className="flex min-w-0 flex-1 items-center gap-3 sm:block">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 sm:mb-4 sm:h-11 sm:w-11 sm:rounded-xl ${colorClasses[color] || colorClasses.blue}`}>
        <span className="text-lg sm:text-xl">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        {category && <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:mb-1.5 sm:text-[10px] sm:tracking-widest">{category}</p>}
        <h3 className="text-sm font-bold leading-snug text-slate-950 dark:text-white sm:mb-2 sm:text-base">{title}</h3>
        <p className="mt-0.5 line-clamp-2 text-xs leading-4 text-slate-600 dark:text-slate-400 sm:mt-0 sm:text-sm sm:leading-6">{description || "Open this free online utility."}</p>
      </div>
    </div>
    <span aria-hidden="true" className="material-icons shrink-0 text-lg text-slate-400 transition-transform group-hover:translate-x-0.5 sm:hidden">east</span>
  </>;
}

CardContent.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  color: PropTypes.string.isRequired,
  description: PropTypes.string,
  category: PropTypes.string,
};

const ToolCard = ({ title, link, icon, color, description, category, actions = [] }) => {
  if (actions.length) {
    return <article className={`${cardClass} flex flex-col p-3 sm:p-5`}>
      <div className="flex items-center gap-2 sm:items-start">
        <CardContent title={title} icon={icon} color={color} description={description} category={category} />
      </div>
      <div className={`mt-3 grid gap-2 border-t border-slate-100 pt-3 dark:border-slate-800 sm:mt-5 ${actions.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {actions.map((action, index) => <Link key={`${action.href}-${action.label}`} to={action.href} className={`group/action inline-flex min-h-11 items-center justify-between gap-1.5 rounded-lg border px-2.5 py-2 text-[10px] font-bold leading-tight transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:px-3 sm:text-xs ${actionClasses[color] || actionClasses.blue} ${actions.length % 2 === 1 && index === actions.length - 1 ? 'col-span-2' : ''}`}>
          <span>{action.label}</span><span aria-hidden="true" className="material-icons shrink-0 text-sm opacity-60 transition-transform group-hover/action:translate-x-0.5">east</span>
        </Link>)}
      </div>
    </article>;
  }

  return <Link to={link} className={`${cardClass} flex flex-col p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:p-5`}>
    <div className="flex items-center gap-2 sm:block">
      <CardContent title={title} icon={icon} color={color} description={description} category={category} />
    </div>
  </Link>;
};

ToolCard.propTypes = {
  title: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  color: PropTypes.string.isRequired,
  description: PropTypes.string,
  category: PropTypes.string,
  actions: PropTypes.arrayOf(PropTypes.shape({ label: PropTypes.string.isRequired, href: PropTypes.string.isRequired })),
};

export default memo(ToolCard);
