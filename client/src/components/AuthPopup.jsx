import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle } from "lucide-react";
import PropTypes from "prop-types";
import { useAuth } from '../hooks/useAuth';
import GoogleSignIn from './GoogleSignIn';
import LoadingSpinner from './common/LoadingSpinner';

const AuthPopup = ({ isOpen, onClose, onLogin, onSkip }) => {
  const { loading, error } = useAuth();
  
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[200]"
        onClick={loading ? undefined : onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-card p-1 max-w-md w-full mx-4 overflow-hidden"
          role="dialog"
        >
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-10 relative">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-xl glass hover:bg-red-500 hover:text-white transition-all focus:outline-none"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="text-center mb-10">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg mx-auto mb-6">
                <span className="material-icons text-3xl">cloud_done</span>
              </div>
              <h2 id="auth-popup-title" className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white mb-2 uppercase">
                Save Progress
              </h2>
              <p id="auth-popup-description" className="text-sm text-slate-500 font-medium tracking-tight">
                Securely store your conversions and access your activity across all professional devices.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-center text-xs font-bold">
                {error}
              </div>
            )}

            {/* Google Login Button */}
            <div className="relative mb-6">
              <GoogleSignIn 
                redirectTo={null} 
                onSuccess={onLogin} 
                buttonText={loading ? 'Synchronizing...' : 'Continue with Google'} 
                disabled={loading}
                className={`w-full !rounded-xl !border-none !bg-slate-50 dark:!bg-slate-800 !shadow-none hover:!bg-slate-100 transition-colors ${loading ? 'opacity-70' : ''}`}
              />
              {loading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>

            {/* Skip Button */}
            <button
              onClick={onSkip}
              disabled={loading}
              className="w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all disabled:opacity-50"
            >
              {loading ? 'Processing Workspace...' : 'Proceed as Guest'}
            </button>

            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                By continuing, you agree to our <a href="/terms" className="text-blue-600 underline">Terms</a> & <a href="/privacy" className="text-blue-600 underline">Privacy</a>.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

AuthPopup.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  // onLogin passed as onSuccess to GoogleSignIn
  onSkip: PropTypes.func.isRequired,
  onLogin: PropTypes.func,
};

export default AuthPopup;