import { Link, useLocation } from "react-router-dom";
import { tools } from "../data/tools.jsx";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid"; // Import icons

const Sidebar = ({ className, onLinkClick, isOpen, onToggle }) => {
  const location = useLocation();

  const sidebarVariants = {
    open: { 
      x: 0,
      width: "20rem",
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    closed: { 
      x: "calc(100% - 3.5rem)",
      width: "3.5rem",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  return (
    <motion.aside
      variants={sidebarVariants}
      initial="closed"
      animate={isOpen ? "open" : "closed"}
      className={`fixed top-24 right-4 h-[calc(100vh-8rem)] glass rounded-3xl overflow-hidden transition-colors duration-300 ${className} border border-white/20 dark:border-slate-800/20 shadow-2xl`}
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
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-sm font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                  Quick Access
                </h2>
              </div>
              
              <ul className="space-y-2">
                {tools
                  .filter(tool => tool.path !== location.pathname)
                  .map((tool, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        to={tool.path}
                        onClick={onLinkClick}
                        className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700/50"
                      >
                        <div className={`w-10 h-10 rounded-xl bg-${tool.color}-500/10 text-${tool.color}-600 dark:text-${tool.color}-400 flex items-center justify-center transition-transform group-hover:scale-110`}>
                          <span className="text-xl">{tool.icon}</span>
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                          {tool.name}
                        </span>
                      </Link>
                    </motion.li>
                  ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
};

Sidebar.propTypes = {
  className: PropTypes.string,
  onLinkClick: PropTypes.func,
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired
};

export default Sidebar;