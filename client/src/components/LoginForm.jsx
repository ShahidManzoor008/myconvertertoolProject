import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import GoogleSignIn from './GoogleSignIn';
import LoadingSpinner from './common/LoadingSpinner';
import { 
  validateField, 
  validateForm, 
  getErrorMessage, 
  ERROR_MESSAGES,
  createInitialTouchedState, 
  touchAllFields 
} from '../utils/validation';

const LoginForm = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState(createInitialTouchedState(form));
  const { login } = useAuth();
  const navigate = useNavigate();

  // GoogleSignIn component handles initialization and redirect on success

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate field on change if it's been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setFormErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setFormErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Mark all fields as touched and validate form
    setTouched(touchAllFields(form));
    const errors = validateForm(form);
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      setLoading(false);
      return;
    }
    
    try {
      if (!navigator.onLine) {
        throw { code: 'network_error' };
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        // Map HTTP status codes to error codes
        const errorCode = {
          401: 'invalid_credentials',
          403: 'account_locked',
          429: 'rate_limit_exceeded',
          500: 'server_error'
        }[res.status] || 'unknown_error';
        
        throw { 
          code: data.code || errorCode,
          message: data.message,
          errors: data.errors
        };
      }

      await login(data); // Store user/token in context
      navigate('/');
    } catch (err) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError(ERROR_MESSAGES.network_error);
      } else {
        setError(getErrorMessage(err));
      }
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto" data-aos="zoom-in">
      <form 
        onSubmit={handleSubmit} 
        className="glass-card p-1 overflow-hidden"
        noValidate
      >
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 sm:p-10 shadow-inner">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg mx-auto mb-6">
              <span className="material-icons text-3xl">lock</span>
            </div>
            <h1 id="login-title" className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">Welcome Back</h1>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-widest" id="login-description">Secure access to your workspace</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="name@company.com"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent transition-all font-bold text-slate-900 dark:text-white outline-none ${
                  touched.email && formErrors.email ? 'border-red-500/50' : 'focus:border-blue-500/50'
                }`}
                required
                autoComplete="email"
              />
              {touched.email && formErrors.email && (
                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest px-1">{formErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400" htmlFor="password">Password</label>
                <a href="/forgot-password" size="sm" className="text-[10px] font-black uppercase text-blue-600 hover:underline">Forgot?</a>
              </div>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent transition-all font-bold text-slate-900 dark:text-white outline-none ${
                  touched.password && formErrors.password ? 'border-red-500/50' : 'focus:border-blue-500/50'
                }`}
                required
                autoComplete="current-password"
              />
              {touched.password && formErrors.password && (
                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest px-1">{formErrors.password}</p>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            className={`w-full btn-primary py-4 mt-10 relative overflow-hidden group ${loading ? 'opacity-80' : ''}`}
            disabled={loading}
          >
            <span className={`flex items-center justify-center gap-2 transition-transform duration-300 ${loading ? 'translate-y-10' : ''}`}>
              Sign In to Dashboard <span className="material-icons text-sm">east</span>
            </span>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <LoadingSpinner size="sm" className="text-white" />
                <span className="ml-2 font-bold uppercase text-xs tracking-widest">Authenticating</span>
              </div>
            )}
          </button>

          <div className="relative my-10 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
            </div>
            <span className="relative px-4 bg-white dark:bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest">Standard Identity</span>
          </div>

          <GoogleSignIn 
            redirectTo="/" 
            buttonText="Sign in with Google"
            disabled={loading}
            className={`w-full !rounded-xl !border-none !bg-slate-50 dark:!bg-slate-800 !shadow-none hover:!bg-slate-100 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          />

          <p className="text-center mt-10 text-xs font-bold text-slate-500 uppercase tracking-widest">
            New here? <Link to="/register" className="text-blue-600 hover:underline">Create Account</Link>
          </p>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-center text-xs font-bold"
            >
              {error}
            </motion.div>
          )}
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
