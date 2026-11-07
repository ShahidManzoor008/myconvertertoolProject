import { Link, NavLink } from 'react-router-dom';
import { Bars3Icon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';

const NavBar = ({ darkMode, onDarkModeToggle, user, onLogout, isMobileMenuOpen, onMobileMenuToggle, navigation }) => (
  <header className="site-header" inert={isMobileMenuOpen}>
    <nav aria-label="Main navigation" className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:h-20 sm:px-6 lg:px-8">
      <Link to="/" aria-label="MyConverterTool home" className="flex shrink-0 items-center gap-2.5">
        <span aria-hidden="true" className="flex h-9 w-9 max-[360px]:h-8 max-[360px]:w-8 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white">C</span>
        <span className="text-sm max-[360px]:text-xs font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-xl">MyConverter<span className="text-blue-600 dark:text-blue-400">Tool</span></span>
      </Link>
      <div className="hidden items-center gap-1 xl:flex">
        {navigation.filter(item => ['Home', 'Tools', 'Blog', 'About'].includes(item.name)).map(item => (
          <NavLink key={item.href} to={item.href} end={item.href === '/'} className={({isActive}) => `rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${isActive ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>{item.name}</NavLink>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {!user ? <div className="hidden items-center gap-2 lg:flex">
          <Link to="/login" className="rounded-lg px-3 py-3 text-sm font-semibold">Sign in</Link>
          <Link to="/register" className="btn-primary px-4 py-2 text-sm">Create account</Link>
        </div> : <>
          {user.isAdmin && <Link to="/admin" className="hidden rounded-lg px-3 py-3 text-sm font-semibold lg:block">Dashboard</Link>}
          <Link to="/profile" className="hidden rounded-lg bg-slate-100 px-3 py-3 text-sm font-semibold dark:bg-slate-800 sm:block">My account</Link>
          <button onClick={onLogout} className="hidden rounded-lg px-3 py-3 text-sm font-semibold xl:block">Sign out</button>
        </>}
        <button type="button" onClick={onDarkModeToggle} aria-label={darkMode ? 'Use light theme' : 'Use dark theme'} aria-pressed={darkMode} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
        </button>
        <button type="button" onClick={() => onMobileMenuToggle(true)} aria-label="Open menu" aria-controls="mobile-navigation" aria-expanded={isMobileMenuOpen} className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 xl:hidden"><Bars3Icon className="h-5 w-5" /></button>
      </div>
    </nav>
  </header>
);
NavBar.propTypes = { darkMode: PropTypes.bool.isRequired, onDarkModeToggle: PropTypes.func.isRequired, user: PropTypes.object, onLogout: PropTypes.func.isRequired, isMobileMenuOpen: PropTypes.bool.isRequired, onMobileMenuToggle: PropTypes.func.isRequired, navigation: PropTypes.array.isRequired };
export default NavBar;
