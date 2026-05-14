import { motion } from "framer-motion";
import { useLocation, Link } from "react-router-dom";
import { XMarkIcon, UserCircleIcon, ShieldCheckIcon } from "@heroicons/react/24/solid";
import PropTypes from "prop-types";
import { tools } from "../data/tools.jsx";

const MobileMenu = ({ onClose, user, onLogout, navigation, isOpen }) => {
  const location = useLocation();

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 w-full sm:w-80 glass border-l border-white/20 dark:border-slate-800/20 shadow-2xl z-50 md:hidden flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation menu"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10 dark:border-slate-800/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg">
            <span className="material-icons text-sm">architecture</span>
          </div>
          <span className="text-lg font-black tracking-tighter">MENU</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 glass rounded-xl hover:bg-red-500 hover:text-white transition-all"
          aria-label="Close menu"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Menu Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="p-6 space-y-8">
          {/* Navigation Links */}
          <nav className="space-y-2">
            <h2 className="text-xs font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-4 px-2">
              Navigation
            </h2>
            {user && user.isAdmin && (
              <Link
                to="/admin"
                onClick={onClose}
                className="flex items-center gap-3 p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20"
              >
                <ShieldCheckIcon className="w-5 h-5" />
                <span>Admin Dashboard</span>
              </Link>
            )}
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 p-3 rounded-2xl font-bold transition-all ${
                  location.pathname === item.href
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Account Actions */}
          <div className="space-y-2">
            <h2 className="text-xs font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-4 px-2">
              Account
            </h2>
            {!user ? (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/login"
                  onClick={onClose}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl glass hover:bg-blue-600 hover:text-white transition-all gap-2"
                >
                  <span className="text-xl">🔑</span>
                  <span className="text-xs font-bold uppercase">Sign In</span>
                </Link>
                <Link
                  to="/register"
                  onClick={onClose}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25 gap-2"
                >
                  <span className="text-xl">👤</span>
                  <span className="text-xs font-bold uppercase">Sign Up</span>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/profile"
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 rounded-2xl glass hover:border-blue-500/50 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{user.name}</span>
                    <span className="text-xs text-slate-500 uppercase font-medium">My Profile</span>
                  </div>
                </Link>
                <button
                  onClick={() => { onLogout(); onClose(); }}
                  className="flex items-center justify-center gap-2 w-full p-3 rounded-2xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all mt-2"
                >
                  <span className="material-icons text-sm">logout</span>
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Tools Grid */}
          <div className="pt-4">
            <h2 className="text-xs font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-4 px-2">
              Popular Tools
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {tools
                .slice(0, 4)
                .map((tool, index) => (
                  <Link
                    key={index}
                    to={tool.path}
                    onClick={onClose}
                    className="flex flex-col items-center p-4 rounded-2xl glass hover:border-blue-500/50 transition-all text-center gap-2"
                  >
                    <span className={`w-10 h-10 flex items-center justify-center rounded-xl bg-${tool.color}-500/10 text-${tool.color}-600 dark:text-${tool.color}-400 text-xl`}>
                      {tool.icon}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-tighter text-slate-700 dark:text-slate-300">
                      {tool.name}
                    </span>
                  </Link>
                ))}
            </div>
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