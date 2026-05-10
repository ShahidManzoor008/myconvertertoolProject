import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <form 
      onSubmit={handleSubmit} 
      className="space-y-4 max-w-md mx-auto p-6 border rounded bg-white dark:bg-gray-800 shadow-sm dark:border-gray-700 text-gray-900 dark:text-gray-200"
      aria-labelledby="login-title"
      noValidate
    >
      <h1 id="login-title" className="text-2xl font-semibold text-gray-800 dark:text-white">Welcome back</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400" id="login-description">Sign in to continue to your tools</p>

      <div className="space-y-4 mt-4">
        <div className="space-y-1">
          <label className="sr-only" htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full p-2 border rounded form-control text-gray-900 dark:text-gray-100 ${
              touched.email && formErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            required
            aria-required="true"
            aria-invalid={touched.email && formErrors.email ? "true" : "false"}
            aria-describedby={touched.email && formErrors.email ? "email-error" : undefined}
            autoComplete="email"
          />
          {touched.email && formErrors.email && (
            <p 
              id="email-error" 
              className="text-red-500 text-sm" 
              role="alert"
              aria-live="polite"
            >
              {formErrors.email}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="sr-only" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full p-2 border rounded form-control text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 ${
              touched.password && formErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            required
            aria-required="true"
            aria-invalid={touched.password && formErrors.password ? "true" : "false"}
            aria-describedby={touched.password && formErrors.password ? "password-error" : undefined}
            autoComplete="current-password"
          />
          {touched.password && formErrors.password && (
            <p 
              id="password-error" 
              className="text-red-500 text-sm"
              role="alert"
              aria-live="polite"
            >
              {formErrors.password}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <a 
            href="/forgot-password" 
            className="text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm px-1"
          >
            Forgot password?
          </a>
        </div>
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">Need an account? </span>
          <a 
            href="/register" 
            className="text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm px-1"
          >
            Register
          </a>
        </div>
      </div>

      <button 
        type="submit" 
        className={`w-full p-2 rounded transition-all duration-150 relative
          ${loading 
            ? 'bg-blue-500 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          }
        `}
        disabled={loading}
        aria-busy={loading}
      >
        <span className={`inline-block transition-opacity duration-150 ${loading ? 'opacity-0' : 'opacity-100'}`}>
          Login
        </span>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner size="sm" className="text-white" />
            <span className="ml-2 text-white">Logging in...</span>
          </div>
        )}
      </button>

      <div className="relative my-4">
        <hr className="border-gray-200 dark:border-gray-700" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 px-3 text-sm text-gray-400 dark:text-gray-300">or</span>
      </div>

      <div className="relative">
        <GoogleSignIn 
          redirectTo="/" 
          buttonText="Continue with Google"
          disabled={loading}
          className={loading ? 'opacity-70 cursor-not-allowed' : ''}
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50">
            <LoadingSpinner size="sm" className="text-gray-600 dark:text-gray-300" />
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md" role="alert">
          <p className="text-red-600 dark:text-red-300 text-sm font-medium">{error}</p>
          {error === ERROR_MESSAGES.network_error && (
            <p className="text-red-500 dark:text-red-400 text-xs mt-1">
              Check your internet connection and try again.
            </p>
          )}
          {error === ERROR_MESSAGES.rate_limit_exceeded && (
            <p className="text-red-500 dark:text-red-400 text-xs mt-1">
              Please wait a few minutes before trying again.
            </p>
          )}
        </div>
      )}
    </form>
  );
};

export default LoginForm;
