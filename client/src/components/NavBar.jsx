import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon
} from "@heroicons/react/24/solid";
import PropTypes from "prop-types";
import { NavItem } from "./NavItem";
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
    <nav className="fixed top-0 left-0 w-full bg-white dark:bg-gray-800 shadow-md px-6 py-4 flex justify-between items-center z-50">
      {/* Logo */}
      <Link
        to="/"
        className="text-lg md:text-2xl font-bold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition duration-300"
      >
        My Converter Tools 🚀
      </Link>

      {/* Desktop Menu */}
      <div className="hidden md:flex gap-6 items-center">
        {/* Always show main links */}
        {navigation.filter(item => !['Profile', 'Register', 'Login'].includes(item.name)).map((item) => (
          <NavItem key={item.name} to={item.href} icon={item.icon} text={item.name} activePath={location.pathname} />
        ))}
        {/* Auth links */}
        {!user && (
          <>
            <NavItem to="/register" text="Register" activePath={location.pathname} icon={<span>👤</span>} />
            <NavItem to="/login" text="Login" activePath={location.pathname} icon={<span>🔑</span>} />
          </>
        )}
        {user && (
          <>
            {user.isAdmin && (
              <NavItem to="/admin" text="Admin" activePath={location.pathname} icon={<ShieldCheckIcon className='w-5 h-5' />} />
            )}
            <NavItem to="/profile" text="Profile" activePath={location.pathname} icon={<UserCircleIcon className='w-5 h-5' />} />
            <button
              onClick={onLogout}
              className="ml-4 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Logout
            </button>
          </>
        )}
      </div>

      {/* Dark Mode Toggle and Mobile Menu Button Group */}
      <div className="flex items-center gap-4">
        {/* Dark Mode Toggle */}
        <motion.button
          onClick={onDarkModeToggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          <motion.div
            initial={false}
            animate={{ rotate: darkMode ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {darkMode ? (
              <SunIcon className="w-6 h-6 text-yellow-400" />
            ) : (
              <MoonIcon className="w-6 h-6 text-gray-800 dark:text-gray-200" />
            )}
          </motion.div>
        </motion.button>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden z-50"
          onClick={() => onMobileMenuToggle(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? (
            <XMarkIcon className="w-7 h-7 text-gray-700 dark:text-gray-100" />
          ) : (
            <Bars3Icon className="w-7 h-7 text-gray-700 dark:text-gray-100" />
          )}
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