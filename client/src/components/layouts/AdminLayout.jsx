import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const sidebarRef = useRef(null);
  const triggerRef = useRef(null);
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 768px)').matches);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsSidebarOpen(false);
    };
    const desktop = window.matchMedia('(min-width: 768px)');
    const closeOnDesktop = () => {
      setIsDesktop(desktop.matches);
      if (desktop.matches) setIsSidebarOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    desktop.addEventListener('change', closeOnDesktop);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      desktop.removeEventListener('change', closeOnDesktop);
    };
  }, []);

  useEffect(() => {
    if (!isSidebarOpen || isDesktop) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const elements = () => [...sidebarRef.current.querySelectorAll('a[href], button:not([disabled])')]
      .filter(element => element.getClientRects().length);
    elements()[0]?.focus({ preventScroll: true });
    const trapFocus = event => {
      if (event.key !== 'Tab') return;
      const items = elements();
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', trapFocus);
    const trigger = triggerRef.current;
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', trapFocus);
      trigger?.focus({ preventScroll: true });
    };
  }, [isSidebarOpen, isDesktop]);

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'grid_view' },
    { path: '/admin/posts', label: 'Blog Posts', icon: 'article' },
    { path: '/admin/users', label: 'Users', icon: 'people' },
    { path: '/admin/analytics', label: 'Analytics', icon: 'analytics' },
    { path: '/admin/settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <div className="admin-workspace min-h-[calc(100dvh-5rem)] rounded-xl bg-gray-50 dark:bg-gray-900 md:grid md:grid-cols-[14rem_minmax(0,1fr)] md:items-start md:gap-4">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close admin navigation"
          tabIndex={-1}
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-gray-950/50 md:hidden"
        />
      )}
      {/* Sidebar */}
      <aside
        id="admin-navigation"
        ref={sidebarRef}
        inert={!isDesktop && !isSidebarOpen}
        role={isDesktop ? undefined : 'dialog'}
        aria-modal={!isDesktop && isSidebarOpen ? true : undefined}
        aria-label="Admin navigation"
        className={`fixed left-0 top-0 z-50 h-dvh w-[min(18rem,calc(100vw-3rem))] bg-white shadow-lg transition-transform duration-300 dark:bg-gray-800 md:sticky md:top-24 md:z-20 md:h-[calc(100dvh-7rem)] md:w-auto md:translate-x-0 md:rounded-xl md:border md:border-gray-200 md:shadow-none dark:md:border-gray-700 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <Link to="/admin/dashboard" onClick={() => setIsSidebarOpen(false)} className="text-base font-semibold text-blue-600 dark:text-blue-400">
              Admin Panel
            </Link>
            <button
              type="button"
              aria-label="Close admin navigation"
              onClick={() => setIsSidebarOpen(false)}
              className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden"
            >
              <span aria-hidden="true" className="material-icons">
                close
              </span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-2 px-3">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    aria-current={location.pathname.startsWith(item.path) ? 'page' : undefined}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      location.pathname.startsWith(item.path)
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span aria-hidden="true" className="material-icons mr-3">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User Section */}
          <div className="border-t dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <span aria-hidden="true" className="material-icons text-sm">person</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.name || 'Admin'}</p>
                  <button
                    type="button"
                    onClick={() => { setIsSidebarOpen(false); logout(); }}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="min-w-0">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex min-w-0 items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                ref={triggerRef}
                aria-label="Open admin navigation"
                aria-expanded={isSidebarOpen}
                aria-controls="admin-navigation"
                onClick={() => setIsSidebarOpen(true)}
                className="shrink-0 rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden"
              >
                <span aria-hidden="true" className="material-icons">menu</span>
              </button>
              <p className="truncate text-base font-semibold text-gray-800 dark:text-gray-200">
              {menuItems.find(item => location.pathname.startsWith(item.path))?.label || 'Admin'}
              </p>
            </div>
            <Link to="/" className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-medium text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-gray-700">View site</Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="min-w-0 p-4 sm:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
