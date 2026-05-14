import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import Sidebar from "./Sidebar";
import ScrollToTop from "./ScrollToTop";
import NavBar from "./NavBar";
import SEO from "../utils/SEO";
import { navigation } from "../data/navigation.jsx";
import PropTypes from "prop-types";
import { useAuth } from "../hooks/useAuth"; // Changed from default to named import

const Layout = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme !== null) {
      return savedTheme === "dark";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const { user, logout } = useAuth();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition duration-300">
      <SEO 
        title="My Converter Tool - Free Online Tools for Developers & Creators"
        description="Access free developer & productivity tools like JSON Formatter, PDF Converter, Base64 Encoder, and more. No sign-up required!"
        keywords="free online tools, developer tools, JSON Formatter, PDF Converter, QR Code Generator, Base64 Encoder"
      />

      {/* Navbar */}
      <NavBar
        darkMode={darkMode}
        onDarkModeToggle={() => {
          const newDarkMode = !darkMode;
          setDarkMode(newDarkMode);
          localStorage.setItem("theme", newDarkMode ? "dark" : "light");
        }}
        user={user}
        onLogout={logout}
        isMobileMenuOpen={isMenuOpen}
        onMobileMenuToggle={setIsMenuOpen}
        navigation={navigation}
      />

      {/* Page Content & Sidebar */}
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

      {/* Footer */}
      <footer className="w-full bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-300 p-6 text-center mt-10">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          © {new Date().getFullYear()} My Converter Tools |{" "}
          <Link to="/about" className="underline hover:text-gray-400">
            About
          </Link>
        </motion.p>
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
