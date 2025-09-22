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
      width: "16rem",
      transition: { 
        type: "spring",
        stiffness: 400,
        damping: 40
      }
    },
    closed: { 
      x: "calc(100% - 3rem)",
      width: "3rem",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40
      }
    }
  };

  return (
    <motion.aside
      variants={sidebarVariants}
      initial="closed"
      animate={isOpen ? "open" : "closed"}
      className={`fixed top-20 right-0 h-[calc(100vh-5rem)] bg-white dark:bg-gray-800 shadow-lg overflow-hidden transition-colors duration-300 ${className}`}
    >
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`absolute top-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors ${isOpen ? 'right-2' : 'left-2'}`} // Conditional positioning
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" /> // Close icon
        ) : (
          <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" /> // Open icon
        )}
      </button>

      <div className="p-4 overflow-y-auto h-full">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">
                📂 Tools
              </h2>
              <ul className="space-y-2">
                {tools
                  .filter(tool => tool.path !== location.pathname)
                  .map((tool, index) => (
                    <motion.li
                      key={index}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        to={tool.path}
                        onClick={onLinkClick}
                        className={`group flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300`}
                        aria-label={`Go to ${tool.name} tool`}
                      >
                        <span 
                          className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md bg-${tool.color}-500 text-white`} 
                          aria-hidden="true"
                        >
                          {tool.icon}
                        </span>
                        <span className="text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
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