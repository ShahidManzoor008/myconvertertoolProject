import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import AuthContext from '../context/AuthContext';
import { authApi } from '../utils/apiClient';
import { AppError, AuthenticationError, AuthorizationError } from '../utils/AppError';

const TOKEN_STORAGE_KEY = 'auth_token';
const USER_STORAGE_KEY = 'auth_user';
const CHANNEL_NAME = 'auth_sync';

// Helper: Safe storage operations with error handling
const storage = {
  get: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      console.error(`Failed to read from localStorage: ${key}`, err);
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (err) {
      console.error(`Failed to write to localStorage: ${key}`, err);
      return false;
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (err) {
      console.error(`Failed to remove from localStorage: ${key}`, err);
      return false;
    }
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [channel] = useState(() => {
    try {
      return new BroadcastChannel(CHANNEL_NAME);
    } catch (err) {
      console.warn('BroadcastChannel not supported:', err);
      return null;
    }
  });

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = storage.get(TOKEN_STORAGE_KEY);
        const userData = storage.get(USER_STORAGE_KEY);

        if (token && userData) {
          try {
            // Verify token with backend
            const { user: verifiedUser } = await authApi.verify();
            const parsedUser = JSON.parse(userData);
            setUser({ ...parsedUser, ...verifiedUser, isAdmin: verifiedUser.role === 'admin' });
          } catch (verifyError) {
            // Handle 401/403 errors silently - just clear the session
            if (verifyError instanceof AuthenticationError || 
                verifyError instanceof AuthorizationError) {
              storage.remove(TOKEN_STORAGE_KEY);
              storage.remove(USER_STORAGE_KEY);
              channel?.postMessage({ type: 'logout' });
              // Don't set error for normal session expiration
              console.debug('Session expired, cleared auth data');
            } else {
              // For other errors, might be temporary server issues
              console.error('Token verification failed:', verifyError);
              setError('Unable to verify session. Please try again later.');
            }
          }
        }
      } catch (err) {
        // Handle initialization errors (like localStorage access)
        console.error('Auth initialization failed:', err);
        setError('Failed to initialize authentication. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for storage changes from other tabs
    const handleStorage = (e) => {
      if (e.key === TOKEN_STORAGE_KEY) {
        if (!e.newValue) {
          setUser(null); // Token cleared in another tab
        }
      } else if (e.key === USER_STORAGE_KEY) {
        setUser(e.newValue ? JSON.parse(e.newValue) : null);
      }
    };

    // Listen for broadcast messages from other tabs
    const handleMessage = (e) => {
      switch (e.data.type) {
        case 'logout':
          setUser(null);
          break;
        case 'login':
          setUser(e.data.user);
          break;
        default:
          break;
      }
    };

    window.addEventListener('storage', handleStorage);
    channel?.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      channel?.removeEventListener('message', handleMessage);
      // channel?.close(); // Removed to prevent premature channel closure
    };
  }, [channel]);

  // login can accept either:
  // - a Google credential object: { tokenId }
  // - a server login response: { token, user }
  const login = async (payload) => {
    try {
      setLoading(true);
      setError(null);

      let data = null;

      // If payload already contains a server token, use it directly
      if (payload && payload.token && payload.user) {
        data = payload;
      } else if (payload && (payload.tokenId || payload.credential || payload.token)) {
        // Normalize various shapes for Google credential
        const googleToken = payload.tokenId || payload.credential || payload.token;
        // Exchange Google token for our JWT
        data = await authApi.googleAuth(googleToken);
      } else {
        throw new AppError('Invalid login payload', 400);
      }

      // Store in localStorage
      if (storage.set(TOKEN_STORAGE_KEY, data.token) &&
          storage.set(USER_STORAGE_KEY, JSON.stringify(data.user))) {
        setUser({ ...data.user, isAdmin: data.user.role === 'admin' });
        // Notify other tabs
        channel?.postMessage({ type: 'login', user: { ...data.user, isAdmin: data.user.role === 'admin' } });
        return true;
      } else {
        throw new AppError('Failed to store auth data', 500);
      }
    } catch (err) {
      setError(err.message);
      console.error('Login failed:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    try {
      setLoading(true);
      setError(null);

      // Register user
      await authApi.register({ name, email, password });

      // Auto-login after successful registration
      const data = await authApi.login({ email, password });

      if (storage.set(TOKEN_STORAGE_KEY, data.token) && storage.set(USER_STORAGE_KEY, JSON.stringify(data.user))) {
        setUser({ ...data.user, isAdmin: data.user.role === 'admin' });
        channel?.postMessage({ type: 'login', user: { ...data.user, isAdmin: data.user.role === 'admin' } });
        return true;
      } else {
        throw new AppError('Failed to store auth data', 500);
      }
    } catch (err) {
      setError(err.message);
      console.error('Registration failed:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      const token = storage.get(TOKEN_STORAGE_KEY);

      if (token) {
        await authApi.logout();
      }

      storage.remove(TOKEN_STORAGE_KEY);
      storage.remove(USER_STORAGE_KEY);
      // Notify other tabs
      channel?.postMessage({ type: 'logout' });
      setUser(null);
    } catch (err) {
      setError(err.message);
      console.error('Logout failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register,
      logout, 
      loading,
      error,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
