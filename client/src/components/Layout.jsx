import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import Sidebar from "./Sidebar";
import ScrollToTop from "./ScrollToTop";
import { navigation } from "../data/navigation.jsx";
import { tools } from "../data/tools.jsx"; // Import tools data
import {
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  UserCircleIcon,
  ShieldCheckIcon, // Import ShieldCheckIcon for admin dashboard
} from "@heroicons/react/24/solid";
import PropTypes from "prop-types";
import { useAuth } from "../context/useAuth"; // Changed from default to named import

const Layout = ({ children }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
  const { user, logout } = useAuth();

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition duration-300">
       <Helmet>
        <title>My Converter Tool - Free Online Tools for Developers & Creators</title>
        <meta name="description" content="Access free developer & productivity tools like JSON Formatter, PDF Converter, Base64 Encoder, and more. No sign-up required!" />
        <meta name="keywords" content="free online tools, developer tools, JSON Formatter, PDF Converter, QR Code Generator, Base64 Encoder" />
        <meta property="og:title" content="My Converter Tool - Free Online Tools for Developers & Creators" />
        <meta property="og:description" content="Access free developer & productivity tools like JSON Formatter, PDF Converter, Base64 Encoder, and more. No sign-up required!" />
        <meta property="og:image" content="https://myconvertertool.com/assets/og-image.jpg" />
        <meta property="og:url" content="https://myconvertertool.com/" />
      </Helmet>
      {/* ✅ Properly Sticky Navbar */}
      <nav className="fixed top-0 left-0 w-full bg-white dark:bg-gray-800 shadow-md px-6 py-4 flex justify-between items-center z-50">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-bold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition duration-300"
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
                onClick={logout}
                className="ml-4 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Logout
              </button>
            </>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-300"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? <SunIcon className="w-6 h-6 text-yellow-400" /> : <MoonIcon className="w-6 h-6 text-gray-800" />}
        </button>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden z-50"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close mobile menu" : "Open mobile menu"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? (
            <XMarkIcon className="w-7 h-7 text-gray-700 dark:text-gray-100" />
          ) : (
            <Bars3Icon className="w-7 h-7 text-gray-700 dark:text-gray-100" />
          )}
        </button>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                onClick={() => setIsMenuOpen(false)}
                aria-hidden="true"
              />
              
              {/* Menu Panel */}
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
                    onClick={() => setIsMenuOpen(false)}
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
                            onClick={handleLinkClick}
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
                            onClick={handleLinkClick}
                          />
                        </motion.div>
                      ))}
                    </nav>

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
                                onClick={handleLinkClick}
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
            </>
          )}
        </AnimatePresence>

        {/* Backdrop for Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />
        )}
      </nav>

      {/* ✅ Page Content & Sidebar */}
      <div className="flex flex-grow pt-20">
        <div className={`w-full p-6 transition-all duration-300 ${isMenuOpen ? 'lg:mr-64' : 'lg:mr-12'}`}>
          {children}
        </div>
        <Sidebar 
          className="hidden lg:block z-30"
          onLinkClick={handleLinkClick}
          isOpen={isMenuOpen}
          onToggle={() => setIsMenuOpen(!isMenuOpen)}
        />
      </div>

      {/* ✅ Footer */}
      <footer className="w-full bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-300 p-6 text-center mt-10">
        <p>
          © 2025 My Converter Tools |{" "}
          <Link to="/about" className="underline hover:text-gray-400">
            About
          </Link>
        </p>
      </footer>

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
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

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

NavItem.propTypes = {
  to: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  text: PropTypes.string.isRequired,
  activePath: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

export default Layout;
