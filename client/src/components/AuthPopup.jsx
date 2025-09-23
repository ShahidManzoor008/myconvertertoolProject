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
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={loading ? undefined : onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl max-w-md w-full mx-4"
          role="dialog"
          aria-labelledby="auth-popup-title"
          aria-describedby="auth-popup-description"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="text-center mb-6">
            <h2 id="auth-popup-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Save Your Work
            </h2>
            <p id="auth-popup-description" className="text-gray-600 dark:text-gray-300">
              Sign in to save your conversions and access them from anywhere.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div 
              className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg flex items-start"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" aria-hidden="true" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Google Login Button */}
          <div className="relative">
            <GoogleSignIn 
              redirectTo={null} 
              onSuccess={onLogin} 
              buttonText={loading ? 'Signing in...' : 'Continue with Google'} 
              disabled={loading}
              className={loading ? 'opacity-70 cursor-not-allowed' : ''}
            />
            {loading && (
              <LoadingSpinner 
                size="sm" 
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600" 
              />
            )}
          </div>

          {/* Skip Button */}
          <button
            onClick={onSkip}
            disabled={loading}
            className={`w-full text-gray-500 dark:text-gray-400 text-sm font-medium transition-all duration-150
              ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:text-gray-700 dark:hover:text-gray-200'}
            `}
            aria-busy={loading}
          >
            {loading ? 'Please wait...' : 'Continue without signing in'}
          </button>
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