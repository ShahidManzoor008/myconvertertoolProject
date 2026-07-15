import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import ScrollToTop from "./ScrollToTop";
import NavBar from "./NavBar";
import MobileMenu from "./MobileMenu";
import { navigation } from "../data/navigation.jsx";
import PropTypes from "prop-types";
import { useAuth } from "../hooks/useAuth"; // Changed from default to named import
import ConversionTrustBadge from "./ConversionTrustBadge";

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

      {isMobileMenuOpen && (
          <MobileMenu
            onClose={() => setIsMobileMenuOpen(false)}
            user={user}
            onLogout={logout}
            navigation={navigation}
            isOpen={isMobileMenuOpen}
          />
        )}

      {/* Page Content & Sidebar */}
      <div className="flex flex-grow pt-24 sm:pt-28 lg:pt-32">
        <main className={`w-full px-3 sm:px-6 lg:px-8 transition-all duration-300 ${isMenuOpen ? 'lg:mr-64' : 'lg:mr-12'}`}>
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

      <ConversionTrustBadge variant="prefooter" className="mt-16 sm:mt-20" />

      {/* Footer */}
      <footer className="mt-12 w-full border-t border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 sm:mt-16">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-start">
            <div className="text-center md:text-left">
              <Link to="/" className="inline-flex items-center justify-center gap-2 md:justify-start">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-black text-white shadow-sm">C</div>
                <span className="text-lg font-black tracking-tight text-slate-950 dark:text-white">MyConverterTool</span>
              </Link>
              <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400 md:mx-0">
                Fast, practical PDF, text, SEO, and developer utilities built for everyday work.
              </p>
            </div>

            <nav aria-label="Footer tools navigation">
              <h2 className="text-center text-xs font-black uppercase tracking-widest text-slate-400 md:text-left">Explore</h2>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-1">
                <Link to="/tools" className="rounded-lg px-3 py-2 text-center text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 md:text-left">Tools</Link>
                <Link to="/tools/pdf-converter" className="rounded-lg px-3 py-2 text-center text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 md:text-left">PDF Converter</Link>
                <Link to="/blog" className="rounded-lg px-3 py-2 text-center text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 md:text-left">Blog</Link>
              </div>
            </nav>

            <nav aria-label="Footer company navigation">
              <h2 className="text-center text-xs font-black uppercase tracking-widest text-slate-400 md:text-left">Company</h2>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-1">
                <Link to="/about" className="rounded-lg px-3 py-2 text-center text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 md:text-left">About</Link>
                <Link to="/contact" className="rounded-lg px-3 py-2 text-center text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 md:text-left">Contact</Link>
                <Link to="/privacy-policy" className="rounded-lg px-3 py-2 text-center text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 md:text-left">Privacy</Link>
                <Link to="/terms" className="rounded-lg px-3 py-2 text-center text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 md:text-left">Terms</Link>
              </div>
            </nav>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-5 text-center text-xs font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex sm:items-center sm:justify-between sm:text-left">
            <p>© {new Date().getFullYear()} MyConverterTool. All rights reserved.</p>
            <p className="mt-2 sm:mt-0">Free online tools with clean, focused workflows.</p>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
