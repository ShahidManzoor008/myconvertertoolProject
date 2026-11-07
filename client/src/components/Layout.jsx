import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import ScrollToTop from "./ScrollToTop";
import NavBar from "./NavBar";
import MobileMenu from "./MobileMenu";
import { navigation } from "../data/navigation.jsx";
import PropTypes from "prop-types";
import { useAuth } from "../hooks/useAuth"; // Changed from default to named import
import ConversionTrustBadge from "./ConversionTrustBadge";
import SEO from "../utils/SEO";

const Layout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    let savedTheme = null;
    try { savedTheme = localStorage.getItem("theme"); } catch { /* Storage can be blocked. */ }
    if (savedTheme !== null) {
      return savedTheme === "dark";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const { user, logout } = useAuth();
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1280px)');
    const closeAtDesktop = () => { if (media.matches) setIsMobileMenuOpen(false); };
    media.addEventListener('change', closeAtDesktop);
    return () => media.removeEventListener('change', closeAtDesktop);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      try { localStorage.setItem("theme", "dark"); } catch { /* Optional persistence. */ }
    } else {
      document.documentElement.classList.remove("dark");
      try { localStorage.setItem("theme", "light"); } catch { /* Optional persistence. */ }
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <SEO metadataOnly />
      <a className="skip-link" href="#main-content">Skip to content</a>
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
      <div className="flex flex-grow pt-16 sm:pt-20">
        <main id="main-content" tabIndex={-1} inert={isMobileMenuOpen} className="min-w-0 w-full px-4 sm:px-6 lg:px-8">
          <div data-page-content="true" className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

      </div>

      <ConversionTrustBadge variant="prefooter" className="mt-16 sm:mt-20" />

      {/* Footer */}
      <footer inert={isMobileMenuOpen} className="mt-12 w-full border-t border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 sm:mt-16">
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
