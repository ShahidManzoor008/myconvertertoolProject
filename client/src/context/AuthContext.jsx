import { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const AuthContext = createContext(null);

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
          const response = await fetch('/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            setUser(JSON.parse(userData));
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

  const login = async (googleData) => {
    try {
      setLoading(true);
      setError(null);

      // Exchange Google token for our JWT
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: googleData.tokenId })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();

      // Store in localStorage
      if (storage.set(TOKEN_STORAGE_KEY, data.token) &&
          storage.set(USER_STORAGE_KEY, JSON.stringify(data.user))) {
        setUser(data.user);
        // Notify other tabs
        channel?.postMessage({ type: 'login', user: data.user });
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

  const logout = async () => {
    try {
      setLoading(true);
      const token = storage.get(TOKEN_STORAGE_KEY);

      if (token) {
        // Notify backend of logout
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }

      storage.remove(TOKEN_STORAGE_KEY);
      storage.remove(USER_STORAGE_KEY);
      setUser(null);
      // Notify other tabs
      channel?.postMessage({ type: 'logout' });
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

export default AuthContext;