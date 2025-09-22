import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import AuthContext from '../context/AuthContext'; // Import from new location
import API_BASE_URL from '../config/api.config';

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
          // Verify token with backend
          const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const parsedUser = JSON.parse(userData);
            setUser({ ...parsedUser, isAdmin: parsedUser.role === 'admin' });
          } else {
            // Token invalid - clear storage
            storage.remove(TOKEN_STORAGE_KEY);
            storage.remove(USER_STORAGE_KEY);
            channel?.postMessage({ type: 'logout' });
          }
        }
      } catch (err) {
        setError('Failed to initialize authentication');
        console.error('Auth initialization failed:', err);
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
      channel?.close();
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
        // Exchange Google token for our JWT on the backend
        const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token: googleToken })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Login failed');
        }

        data = await response.json();
      } else {
        throw new Error('Invalid login payload');
      }

      // Store in localStorage
      if (storage.set(TOKEN_STORAGE_KEY, data.token) &&
          storage.set(USER_STORAGE_KEY, JSON.stringify(data.user))) {
        setUser({ ...data.user, isAdmin: data.user.role === 'admin' });
        // Notify other tabs
        channel?.postMessage({ type: 'login', user: { ...data.user, isAdmin: data.user.role === 'admin' } });
        return true;
      } else {
        throw new Error('Failed to store auth data');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
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

      // Register user on backend
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Registration failed');
      }

      // Auto-login after successful registration
      const loginRes = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!loginRes.ok) {
        const d = await loginRes.json().catch(() => ({}));
        throw new Error(d.error || 'Auto-login failed after registration');
      }

      const data = await loginRes.json();

      if (storage.set(TOKEN_STORAGE_KEY, data.token) && storage.set(USER_STORAGE_KEY, JSON.stringify(data.user))) {
        setUser({ ...data.user, isAdmin: data.user.role === 'admin' });
        channel?.postMessage({ type: 'login', user: { ...data.user, isAdmin: data.user.role === 'admin' } });
        return true;
      } else {
        throw new Error('Failed to store auth data');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
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
        // Notify backend of logout
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }

      storage.remove(TOKEN_STORAGE_KEY);
      storage.remove(USER_STORAGE_KEY);
      // Notify other tabs
      channel?.postMessage({ type: 'logout' });
      setUser(null);
    } catch (err) {
      setError('Logout failed');
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
