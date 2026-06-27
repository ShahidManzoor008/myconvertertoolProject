import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import ScrollToTop from "./ScrollToTop";
import NavBar from "./NavBar";
import MobileMenu from "./MobileMenu";
import SEO from "../utils/SEO";
import { navigation } from "../data/navigation.jsx";
import PropTypes from "prop-types";
import { useAuth } from "../hooks/useAuth"; // Changed from default to named import

const Layout = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <SEO 
        title="MyConverterTool - Free Online Tools for Developers & Creators"
        description="Access free developer & productivity tools like JSON Formatter, PDF Converter, Base64 Encoder, and more. No sign-up required!"
        keywords="free online tools, developer tools, JSON Formatter, PDF Converter, QR Code Generator, Base64 Encoder"
      />

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Navbar */}
      <NavBar
        darkMode={darkMode}
        onDarkModeToggle={() => setDarkMode(!darkMode)}
        user={user}
        onLogout={logout}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={setIsMobileMenuOpen}
        navigation={navigation}
      />

      <AnimatePresence>
        {isMobileMenuOpen && (
          <MobileMenu
            onClose={() => setIsMobileMenuOpen(false)}
            user={user}
            onLogout={logout}
            navigation={navigation}
            isOpen={isMobileMenuOpen}
          />
        )}
      </AnimatePresence>

      {/* Page Content & Sidebar */}
      <div className="flex flex-grow pt-32">
        <main className={`w-full px-4 sm:px-6 lg:px-8 transition-all duration-300 ${isMenuOpen ? 'lg:mr-64' : 'lg:mr-12'}`}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        <Sidebar 
          className="hidden lg:block z-30"
          onLinkClick={handleLinkClick}
          isOpen={isMenuOpen}
          onToggle={() => setIsMenuOpen(!isMenuOpen)}
        />
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-12 text-center mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">C</div>
            <span className="font-black tracking-tighter">MyConverterTool</span>
          </div>
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} MyConverterTool. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/about" className="text-sm font-bold hover:text-blue-600 transition-colors">About</Link>
            <Link to="/tools" className="text-sm font-bold hover:text-blue-600 transition-colors">Tools</Link>
            <Link to="/blog" className="text-sm font-bold hover:text-blue-600 transition-colors">Blog</Link>
            <Link to="/contact" className="text-sm font-bold hover:text-blue-600 transition-colors">Contact</Link>
            <Link to="/privacy-policy" className="text-sm font-bold hover:text-blue-600 transition-colors">Privacy</Link>
            <Link to="/terms" className="text-sm font-bold hover:text-blue-600 transition-colors">Terms</Link>
          </div>
        </div>
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
