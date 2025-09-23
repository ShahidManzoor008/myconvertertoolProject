import { motion } from "framer-motion";
import { useLocation, Link } from "react-router-dom";
import { XMarkIcon, UserCircleIcon, ShieldCheckIcon } from "@heroicons/react/24/solid";
import PropTypes from "prop-types";
import { tools } from "../data/tools.jsx";

const MobileMenu = ({ onClose, user, onLogout, navigation }) => {
  const location = useLocation();

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-gray-800 shadow-lg overflow-hidden z-50 md:hidden flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation menu"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Menu</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          aria-label="Close menu"
        >
          <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Menu Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Navigation Links */}
          <nav className="space-y-1">
            {user && user.isAdmin && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: navigation.length * 0.1 }}
              >
                <NavItem
                  to="/admin"
                  icon={<ShieldCheckIcon className='w-5 h-5' />}
                  text="Admin Dashboard"
                  activePath={location.pathname}
                  onClick={onClose}
                />
              </motion.div>
            )}
            {navigation.map((item) => (
              <motion.div
                key={item.name}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: navigation.indexOf(item) * 0.1 }}
              >
                <NavItem
                  to={item.href}
                  icon={item.icon}
                  text={item.name}
                  activePath={location.pathname}
                  onClick={onClose}
                />
              </motion.div>
            ))}
          </nav>

          {/* Auth links for Mobile */}
          {!user && (
            <>
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: (navigation.length + 0) * 0.1 }}
              >
                <NavItem to="/register" text="Register" activePath={location.pathname} icon={<span>👤</span>} onClick={onClose} />
              </motion.div>
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: (navigation.length + 1) * 0.1 }}
              >
                <NavItem to="/login" text="Login" activePath={location.pathname} icon={<span>🔑</span>} onClick={onClose} />
              </motion.div>
            </>
          )}
          {user && (
            <>
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: (navigation.length + 0) * 0.1 }}
              >
                <NavItem to="/profile" text="Profile" activePath={location.pathname} icon={<UserCircleIcon className='w-5 h-5' />} onClick={onClose} />
              </motion.div>
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: (navigation.length + 1) * 0.1 }}
              >
                <button
                  onClick={() => { onLogout(); onClose(); }}
                  className="w-full text-left px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                  Logout
                </button>
              </motion.div>
            </>
          )}

          {/* Tools Section */}
          <div className="pt-4">
            <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-3">
              📂 Available Tools
            </h2>
            <ul className="grid grid-cols-2 gap-3">
              {tools
                .filter(tool => tool.path !== location.pathname)
                .map((tool, index) => (
                  <motion.li
                    key={index}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={tool.path}
                      onClick={onClose}
                      className="flex flex-col items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      aria-label={`Go to ${tool.name} tool`}
                    >
                      <span className={`w-10 h-10 flex items-center justify-center rounded-lg bg-${tool.color}-500 text-white mb-2`}>
                        {tool.icon}
                      </span>
                      <span className="text-sm text-center text-gray-700 dark:text-gray-300">
                        {tool.name}
                      </span>
                    </Link>
                  </motion.li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ✅ Reusable Nav Item Component
const NavItem = ({ to, icon, text, activePath, onClick }) => {
  const isActive = activePath === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 transition duration-300 relative ${
        isActive
          ? "text-blue-600 font-bold border-b-2 border-blue-600 dark:border-blue-400"
          : "text-gray-800 dark:text-gray-200 hover:text-blue-500 dark:hover:text-blue-400"
      }`}
      aria-current={isActive ? "page" : undefined}
    >
      {icon}
      <span className="relative group">
        {text}
        {!isActive && (
          <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-blue-600 dark:bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
        )}
      </span>
    </Link>
  );
};

NavItem.propTypes = {
  to: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  text: PropTypes.string.isRequired,
  activePath: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

MobileMenu.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object,
  onLogout: PropTypes.func.isRequired,
  navigation: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    href: PropTypes.string.isRequired,
    icon: PropTypes.node.isRequired,
  })).isRequired,
};

export default MobileMenu;