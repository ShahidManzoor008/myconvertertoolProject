import { useState, useEffect, useCallback } from "react";
import PageNavigation from "./PageNavigation";
import ScrollToTop from "./ScrollToTop";
import NavBar from "./NavBar";
import MobileMenu from "./MobileMenu";
import { navigation } from "../data/navigation.jsx";
import PropTypes from "prop-types";
import { useAuth } from "../hooks/useAuth"; // Changed from default to named import
import ConversionTrustBadge from "./ConversionTrustBadge";
import Footer from "./Footer";
import SEO from "../utils/SEO";
import PwaInstallPrompt from "./PwaInstallPrompt";
import { getPwaInstallState, subscribeToPwaInstall } from "../utils/pwaInstall";
import CookieConsentNotice from './CookieConsentNotice';

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
  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);
  const [pwaInstallState, setPwaInstallState] = useState(getPwaInstallState);

  useEffect(() => subscribeToPwaInstall(setPwaInstallState), []);
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
      <PageNavigation />
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
        showInstallAction={!pwaInstallState.installed}
        onInstallApp={() => window.dispatchEvent(new Event('myconvertertool:open-install'))}
      />
      <PwaInstallPrompt />
      <CookieConsentNotice />

      {isMobileMenuOpen && (
          <MobileMenu
            onClose={closeMobileMenu}
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

      <div inert={isMobileMenuOpen} className="mt-8 sm:mt-10">
        <ConversionTrustBadge variant="prefooter" />
        <Footer />
      </div>

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
