import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  ShieldCheckIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon
} from "@heroicons/react/24/solid";
import PropTypes from "prop-types";
import MobileMenu from "./MobileMenu";

const NavBar = ({ 
  darkMode, 
  onDarkModeToggle, 
  user, 
  onLogout, 
  isMobileMenuOpen, 
  onMobileMenuToggle,
  navigation 
}) => {
  const location = useLocation();

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl glass rounded-2xl px-6 py-3 flex justify-between items-center z-50 border border-white/20 dark:border-slate-800/20 shadow-2xl">
      {/* Logo */}
      <Link
        to="/"
        className="flex items-center gap-2 group"
      >
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform duration-300">
          <span className="material-icons">architecture</span>
        </div>
        <span className="hidden sm:block text-xl font-black tracking-tighter text-slate-900 dark:text-white">
          MyConverter<span className="text-blue-600">Tool</span>
        </span>
      </Link>

      {/* Desktop Menu */}
      <div className="hidden md:flex gap-2 items-center bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
        {navigation.filter(item => !['Profile', 'Register', 'Login'].includes(item.name)).map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              location.pathname === item.href 
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>

      {/* Action Group */}
      <div className="flex items-center gap-3">
        {!user ? (
          <div className="hidden sm:flex items-center gap-2">
            <Link to="/login" className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="btn-primary py-2 px-5 text-sm">
              Sign Up
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {user.isAdmin && (
              <Link to="/admin" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400" title="Admin Panel">
                <ShieldCheckIcon className="w-5 h-5" />
              </Link>
            )}
            <Link to="/profile" className="flex items-center gap-2 p-1 pr-3 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500/50 transition-all">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                {user.name.charAt(0)}
              </div>
              <span className="text-xs font-bold hidden lg:block">{user.name}</span>
            </Link>
            <button
              onClick={onLogout}
              className="hidden lg:block text-xs font-bold text-red-500 hover:text-red-600"
            >
              Logout
            </button>
          </div>
        )}

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

        <button
          onClick={onDarkModeToggle}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          aria-label="Toggle Theme"
        >
          {darkMode ? <SunIcon className="w-5 h-5 text-yellow-500" /> : <MoonIcon className="w-5 h-5 text-slate-700" />}
        </button>

        <button
          className="md:hidden p-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900"
          onClick={() => onMobileMenuToggle(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
              onClick={() => onMobileMenuToggle(false)}
              aria-hidden="true"
            />
            
            {/* Menu Component */}
            <MobileMenu
              user={user}
              onClose={() => onMobileMenuToggle(false)}
              onLogout={onLogout}
              navigation={navigation}
            />
          </>
        )}
      </AnimatePresence>

      {/* Backdrop for Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => onMobileMenuToggle(false)}
          aria-hidden="true"
        />
      )}
    </nav>
  );
};

NavBar.propTypes = {
  darkMode: PropTypes.bool.isRequired,
  onDarkModeToggle: PropTypes.func.isRequired,
  user: PropTypes.object,
  onLogout: PropTypes.func.isRequired,
  isMobileMenuOpen: PropTypes.bool.isRequired,
  onMobileMenuToggle: PropTypes.func.isRequired,
  navigation: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    href: PropTypes.string.isRequired,
    icon: PropTypes.node.isRequired,
  })).isRequired,
};

export default NavBar;