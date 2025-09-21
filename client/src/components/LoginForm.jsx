import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import GoogleSignIn from './GoogleSignIn';

// Validation rules
const VALIDATION_RULES = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    minLength: 5,
    maxLength: 50,
    message: 'Please enter a valid email address'
  },
  password: {
    minLength: 8,
    maxLength: 100,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
    message: 'Password must be at least 8 characters and contain uppercase, lowercase, and numbers'
  }
};

// Error messages mapping for common server responses
const ERROR_MESSAGES = {
  'invalid_credentials': 'Invalid email or password',
  'account_locked': 'Account locked. Please contact support',
  'account_not_verified': 'Please verify your email address',
  'rate_limit_exceeded': 'Too many login attempts. Please try again later',
  'server_error': 'Server error. Please try again later',
  'network_error': 'Network error. Please check your connection'
};

const getErrorMessage = (error) => {
  if (error.code && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code];
  }
  if (error.errors && Array.isArray(error.errors)) {
    return error.errors.map(e => e.msg).join(', ');
  }
  return error.message || 'An unexpected error occurred';
};

const LoginForm = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState({ email: false, password: false });
  const { login } = useAuth();
  const navigate = useNavigate();

  // GoogleSignIn component handles initialization and redirect on success

  const validateField = (name, value) => {
    const rules = VALIDATION_RULES[name];
    if (!rules) return '';

    if (value.length < rules.minLength) {
      return `Must be at least ${rules.minLength} characters`;
    }
    if (value.length > rules.maxLength) {
      return `Must be less than ${rules.maxLength} characters`;
    }
    if (!rules.pattern.test(value)) {
      return rules.message;
    }
    return '';
  };

  const validateForm = () => {
    const errors = {};
    Object.keys(form).forEach(field => {
      const error = validateField(field, form[field]);
      if (error) errors[field] = error;
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

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
    setTouched({ email: true, password: true });
    if (!validateForm()) {
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
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-6 border rounded bg-white shadow-sm">
      <h2 className="text-2xl font-semibold text-gray-800">Welcome back</h2>
      <p className="text-sm text-gray-500">Sign in to continue to your tools</p>

      <div className="space-y-4 mt-4">
        <div className="space-y-1">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full p-2 border rounded form-control text-gray-900 dark:text-gray-100 ${
              touched.email && formErrors.email ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            required
          />
          {touched.email && formErrors.email && (
            <p className="text-red-500 text-sm">{formErrors.email}</p>
          )}
        </div>

        <div className="space-y-1">
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full p-2 border rounded form-control text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 ${
              touched.password && formErrors.password ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            required
          />
          {touched.password && formErrors.password && (
            <p className="text-red-500 text-sm">{formErrors.password}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <a href="/forgot-password" className="text-blue-600 hover:underline">Forgot password?</a>
        </div>
        <div className="text-sm text-gray-500">Need an account? <a href="/register" className="text-blue-600 hover:underline">Register</a></div>
      </div>

      <button 
        type="submit" 
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors disabled:bg-blue-400" 
        disabled={loading}
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>

      <div className="relative my-4">
        <hr className="border-gray-200" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-sm text-gray-400">or</span>
      </div>

      <div>
        {/* Google Sign In Button moved below the form controls to follow standard UX */}
        <GoogleSignIn redirectTo="/" buttonText="Continue with Google" />
      </div>

      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm font-medium">{error}</p>
          {error === ERROR_MESSAGES.network_error && (
            <p className="text-red-500 text-xs mt-1">
              Check your internet connection and try again.
            </p>
          )}
          {error === ERROR_MESSAGES.rate_limit_exceeded && (
            <p className="text-red-500 text-xs mt-1">
              Please wait a few minutes before trying again.
            </p>
          )}
        </div>
      )}
    </form>
  );
};

export default LoginForm;
