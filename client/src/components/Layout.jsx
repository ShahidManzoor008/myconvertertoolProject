import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import {
  HomeIcon,
  WrenchScrewdriverIcon,
  InformationCircleIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  NewspaperIcon,
} from "@heroicons/react/24/solid";

const Layout = ({ children }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition duration-300">
      {/* ✅ Properly Sticky Navbar */}
      <nav className="fixed top-0 left-0 w-full bg-white dark:bg-gray-800 shadow-md px-6 py-4 flex justify-between items-center z-50">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-bold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition duration-300"
        >
          SMS Coding Online 🚀
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-6">
          <NavItem to="/" icon={<HomeIcon className="w-5 h-5" />} text="Home" activePath={location.pathname} />
          <NavItem to="/tools" icon={<WrenchScrewdriverIcon className="w-5 h-5" />} text="Tools" activePath={location.pathname} />
          <NavItem to="/blog" icon={<NewspaperIcon className="w-5 h-5" />} text="Blog" activePath={location.pathname} />
          <NavItem to="/about" icon={<InformationCircleIcon className="w-5 h-5" />} text="About" activePath={location.pathname} />
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-300"
        >
          {darkMode ? <SunIcon className="w-6 h-6 text-yellow-400" /> : <MoonIcon className="w-6 h-6 text-gray-800" />}
        </button>

        {/* Mobile Menu Button */}
        <button className="md:hidden z-50" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? (
            <XMarkIcon className="w-7 h-7 text-gray-700 dark:text-gray-100" />
          ) : (
            <Bars3Icon className="w-7 h-7 text-gray-700 dark:text-gray-100" />
          )}
        </button>
      </nav>

      {/* ✅ Mobile Menu (Fixed & Always Visible on Click) */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: isMenuOpen ? 1 : 0, height: isMenuOpen ? "auto" : 0 }}
        transition={{ duration: 0.3 }}
        className={`fixed top-16 left-0 w-full bg-white dark:bg-gray-800 shadow-md overflow-hidden z-40 ${
          isMenuOpen ? "p-4" : "p-0"
        }`}
      >
        <NavItem to="/" icon={<HomeIcon className="w-5 h-5" />} text="Home" activePath={location.pathname} onClick={() => setIsMenuOpen(false)} />
        <NavItem to="/tools" icon={<WrenchScrewdriverIcon className="w-5 h-5" />} text="Tools" activePath={location.pathname} onClick={() => setIsMenuOpen(false)} />
        <NavItem to="/blog" icon={<NewspaperIcon className="w-5 h-5" />} text="Blog" activePath={location.pathname} onClick={() => setIsMenuOpen(false)} />
        <NavItem to="/about" icon={<InformationCircleIcon className="w-5 h-5" />} text="About" activePath={location.pathname} onClick={() => setIsMenuOpen(false)} />
      </motion.div>

      {/* ✅ Page Content & Sidebar */}
      <div className="flex flex-grow pt-20">
        <div className="w-full p-6">{children}</div>
        <Sidebar />
      </div>

      {/* ✅ Footer */}
      <footer className="w-full bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-300 p-6 text-center mt-10">
        <p>
          © 2025 SMS Coding Online |{" "}
          <Link to="/about" className="underline hover:text-gray-400">
            About
          </Link>
        </p>
      </footer>
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

export default Layout;
