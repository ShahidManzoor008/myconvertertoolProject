import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { path: '/admin/dashboard', label: '📊 Dashboard', icon: 'grid_view' },
    { path: '/admin/posts', label: '📝 Blog Posts', icon: 'article' },
    { path: '/admin/users', label: '👥 Users', icon: 'people' },
    { path: '/admin/settings', label: '⚙️ Settings', icon: 'settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close admin navigation"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-gray-950/50 md:hidden"
        />
      )}
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-dvh w-[min(18rem,calc(100vw-3rem))] bg-white shadow-lg transition-transform duration-300 dark:bg-gray-800 md:z-30 md:w-64 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <Link to="/admin/dashboard" onClick={() => setIsSidebarOpen(false)} className="text-xl font-bold text-blue-600 dark:text-blue-400">
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
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                      location.pathname === item.path
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
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Admin</p>
                  <button
                    onClick={() => {/* Handle logout */}}
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
      <main className="min-w-0 md:ml-64">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex min-w-0 items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Open admin navigation"
                aria-expanded={isSidebarOpen}
                onClick={() => setIsSidebarOpen(true)}
                className="shrink-0 rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden"
              >
                <span aria-hidden="true" className="material-icons">menu</span>
              </button>
              <h1 className="truncate text-lg font-semibold text-gray-800 dark:text-gray-200 sm:text-2xl">
              {menuItems.find(item => item.path === location.pathname)?.label || 'Admin'}
              </h1>
            </div>
            <div className="flex shrink-0 items-center space-x-1 sm:space-x-4">
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <span aria-hidden="true" className="material-icons">notifications</span>
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <span aria-hidden="true" className="material-icons">dark_mode</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="min-w-0 p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
