import { useLocation, Link } from "react-router-dom";
import { XMarkIcon, ShieldCheckIcon } from "@heroicons/react/24/solid";
import PropTypes from "prop-types";
import { primaryTools } from "../data/tools.jsx";

const mobileToolColors = {
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  green: "bg-green-500/10 text-green-600 dark:text-green-400",
  yellow: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
  teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
};

const MobileMenu = ({ onClose, user, onLogout, navigation }) => {
  const location = useLocation();

  return (
    <div
      className="fixed inset-y-0 right-0 w-full sm:w-80 glass border-l border-white/20 dark:border-slate-800/20 shadow-2xl z-50 md:hidden flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation menu"
    >
      <div className="p-6 border-b border-white/10 dark:border-slate-800/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg">
            <span className="material-icons text-sm">architecture</span>
          </div>
          <span className="text-lg font-black tracking-tighter">Menu</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 glass rounded-xl hover:bg-red-500 hover:text-white transition-all"
          aria-label="Close menu"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-8">
          <nav className="space-y-2">
            <h2 className="text-xs font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-4 px-2">
              Navigation
            </h2>
            {user && user.isAdmin && (
              <Link
                to="/admin"
                onClick={onClose}
                className="flex items-center gap-3 p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20"
              >
                <ShieldCheckIcon className="w-5 h-5" />
                <span>Admin Dashboard</span>
              </Link>
            )}
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 p-3 rounded-2xl font-bold transition-all ${
                  location.pathname === item.href
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          <div className="space-y-2">
            <h2 className="text-xs font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-4 px-2">
              Account
            </h2>
            {!user ? (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/login"
                  onClick={onClose}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl glass hover:bg-blue-600 hover:text-white transition-all gap-2"
                >
                  <span className="material-icons">login</span>
                  <span className="text-xs font-bold uppercase">Sign In</span>
                </Link>
                <Link
                  to="/register"
                  onClick={onClose}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25 gap-2"
                >
                  <span className="material-icons">person_add</span>
                  <span className="text-xs font-bold uppercase">Sign Up</span>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/profile"
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 rounded-2xl glass hover:border-blue-500/50 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{user.name}</span>
                    <span className="text-xs text-slate-500 uppercase font-medium">My Profile</span>
                  </div>
                </Link>
                <button
                  onClick={() => { onLogout(); onClose(); }}
                  className="flex items-center justify-center gap-2 w-full p-3 rounded-2xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all mt-2"
                >
                  <span className="material-icons text-sm">logout</span>
                  Logout
                </button>
              </div>
            )}
          </div>

          <div className="pt-4">
            <h2 className="text-xs font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-4 px-2">
              Popular Tools
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {primaryTools.slice(0, 4).map((tool) => (
                <Link
                  key={tool.path}
                  to={tool.path}
                  onClick={onClose}
                  className="flex flex-col items-center p-4 rounded-2xl glass hover:border-blue-500/50 transition-all text-center gap-2"
                >
                  <span className={`w-10 h-10 flex items-center justify-center rounded-xl text-xl ${mobileToolColors[tool.color] || mobileToolColors.blue}`}>
                    {tool.icon}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-tighter text-slate-700 dark:text-slate-300">
                    {tool.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

MobileMenu.propTypes = {
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object,
  onLogout: PropTypes.func.isRequired,
  navigation: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    href: PropTypes.string.isRequired,
    icon: PropTypes.node.isRequired,
  })).isRequired,
};

export default MobileMenu;
