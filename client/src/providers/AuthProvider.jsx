import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import AuthContext from '../context/AuthContext';
import { authApi } from '../utils/apiClient';
import { AppError, AuthenticationError, AuthorizationError } from '../utils/AppError';

const TOKEN_STORAGE_KEY = 'auth_token';
const LEGACY_TOKEN_STORAGE_KEY = 'token';
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
        const token = storage.get(TOKEN_STORAGE_KEY) || storage.get(LEGACY_TOKEN_STORAGE_KEY);

        try {
          // One-time migration for existing localStorage JWTs, then cookie-only verification.
          const response = token
            ? await authApi.migrateSession(token)
            : await authApi.verify();
          const verifiedUser = response.user;
          setUser({ ...verifiedUser, isAdmin: verifiedUser.role === 'admin' });
          storage.remove(TOKEN_STORAGE_KEY);
          storage.remove(LEGACY_TOKEN_STORAGE_KEY);
        } catch (verifyError) {
          if (verifyError instanceof AuthenticationError || verifyError instanceof AuthorizationError) {
            storage.remove(TOKEN_STORAGE_KEY);
            storage.remove(LEGACY_TOKEN_STORAGE_KEY);
            channel?.postMessage({ type: 'logout' });
          } else {
            console.error('Session verification failed:', verifyError);
            setError('Unable to verify session. Please try again later.');
          }
        }
        // Do not persist account profile data in browser storage.
        storage.remove(USER_STORAGE_KEY);
      } catch (err) {
        // Handle initialization errors (like localStorage access)
        console.error('Auth initialization failed:', err);
        setError('Failed to initialize authentication. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Keep compatibility with tabs clearing legacy token storage. Profile data
    // is intentionally never restored from localStorage.
    const handleStorage = (e) => {
      if (e.key === TOKEN_STORAGE_KEY) {
        if (!e.newValue) {
          setUser(null); // Token cleared in another tab
        }
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

      // Password login already set an HttpOnly cookie; Google credentials are exchanged first.
      if (payload && payload.user) {
        data = payload;
      } else if (payload && (payload.tokenId || payload.credential || payload.token)) {
        // Normalize various shapes for Google credential
        const googleToken = payload.tokenId || payload.credential || payload.token;
        // Exchange Google token for our JWT
        data = await authApi.googleAuth(googleToken);
      } else {
        throw new AppError('Invalid login payload', 400);
      }

      if (!data?.user) throw new AppError('Sign-in did not return account information.', 500);
      storage.remove(TOKEN_STORAGE_KEY);
      storage.remove(LEGACY_TOKEN_STORAGE_KEY);
      storage.remove(USER_STORAGE_KEY);
      const signedInUser = { ...data.user, isAdmin: data.user.role === 'admin' };
      setUser(signedInUser);
      channel?.postMessage({ type: 'login', user: signedInUser });
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Login failed:', err);
      throw err;
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

      const signedInUser = { ...data.user, isAdmin: data.user.role === 'admin' };
      setUser(signedInUser);
      channel?.postMessage({ type: 'login', user: signedInUser });
      return true;
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
      await authApi.logout();
      storage.remove(TOKEN_STORAGE_KEY);
      storage.remove(LEGACY_TOKEN_STORAGE_KEY);
      storage.remove(USER_STORAGE_KEY);
      // Notify other tabs
      channel?.postMessage({ type: 'logout' });
      setUser(null);
    } catch (err) {
      setError(err.message);
      console.error('Logout failed:', err);
      setUser(null);
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
