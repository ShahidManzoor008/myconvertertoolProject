import { Link, useLocation } from "react-router-dom";
import { tools } from "../data/tools.jsx";
import PropTypes from "prop-types";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid"; // Import icons

const toolColorClasses = {
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  green: "bg-green-500/10 text-green-600 dark:text-green-400",
  yellow: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
  teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
};

const Sidebar = ({ className, onLinkClick, isOpen, onToggle }) => {
  const location = useLocation();

  return (
    <aside
      className={`fixed top-24 right-4 h-[calc(100vh-8rem)] glass rounded-3xl overflow-hidden transition-all duration-300 ${isOpen ? "w-80 translate-x-0" : "w-14 translate-x-[calc(100%-3.5rem)]"} ${className || ""} border border-white/20 dark:border-slate-800/20 shadow-2xl`}
    >
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute top-4 left-3 p-1.5 glass rounded-xl hover:bg-blue-600 hover:text-white transition-all z-20"
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isOpen ? (
          <XMarkIcon className="w-5 h-5" />
        ) : (
          <Bars3Icon className="w-5 h-5" />
        )}
      </button>

      <div className="p-6 pt-16 overflow-y-auto h-full scrollbar-hide">
        {isOpen && (
            <div className="transition-opacity duration-200">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-sm font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                  Quick Access
                </h2>
              </div>
              
              <ul className="space-y-2">
                {tools
                  .filter(tool => tool.path !== location.pathname)
                  .map((tool, index) => (
                    <li key={index}>
                      <Link
                        to={tool.path}
                        onClick={onLinkClick}
                        className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700/50"
                      >
                        <div className={`w-10 h-10 rounded-xl ${toolColorClasses[tool.color] || toolColorClasses.blue} flex items-center justify-center transition-transform group-hover:scale-110`}>
                          <span className="text-xl">{tool.icon}</span>
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                          {tool.name}
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          )}
      </div>
    </aside>
  );
};

Sidebar.propTypes = {
  className: PropTypes.string,
  onLinkClick: PropTypes.func,
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired
};

export default Sidebar;
