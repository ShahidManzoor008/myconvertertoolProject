import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { GOOGLE_CLIENT_ID } from '../config/auth.config';
import GoogleSignInDebug from './GoogleSignInDebug';
import useToast from '../hooks/useToast';

// Loads the Google Identity Services script if not already present
const loadGsi = () => {
  if (window.google && window.google.accounts && window.google.accounts.id) return Promise.resolve();
  const existing = document.getElementById('google-signin');
  if (existing) return new Promise((res) => { existing.addEventListener('load', res); });

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.id = 'google-signin';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

const GoogleSignIn = ({ redirectTo = '/', buttonText = 'Continue with Google', className = '', renderNative = true, onSuccess }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [containerId] = useState(() => `gsi-button-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await loadGsi();
        if (!mounted) return;

        if (!(window.google && window.google.accounts && window.google.accounts.id)) {
          console.warn('[GSI] google.accounts.id not available after load');
          return;
        }

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (res) => {
            console.debug('[GSI] callback invoked', res);
            if (!res?.credential) {
              console.warn('[GSI] no credential in callback', res);
              return;
            }

            setLoading(true);
            try {
              if (typeof login !== 'function') {
                console.error('[GSI] AuthProvider.login is not a function; current value:', login);
                toast?.push?.('Login failed: internal error (no login handler).', { type: 'error' });
                return;
              }

              const maxAttempts = 3;
              const baseDelay = 500;
              let attempt = 0;
              let lastError = null;

              while (attempt < maxAttempts) {
                attempt += 1;
                try {
                  const ok = await login({ tokenId: res.credential });
                  console.debug('[GSI] login() returned', ok);
                  if (ok) {
                    onSuccess?.();
                    if (redirectTo) navigate(redirectTo);
                    return; // Success - exit retry loop
                  }
                  
                  // Login returned false but didn't throw - likely a token exchange issue
                  lastError = new Error('Token exchange failed');
                  console.warn('[GSI] login returned falsy on attempt', attempt);
                } catch (err) {
                  lastError = err;
                  console.error('GoogleSignIn login attempt', attempt, 'failed:', err);

                  // Don't retry client errors (invalid tokens, etc)
                  if (err.code === 'invalid_token' || err.code === 'invalid_request') {
                    throw err;
                  }
                }

                // Apply exponential backoff with jitter for retries
                const jitter = Math.random() * 200;
                const delay = baseDelay * Math.pow(2, attempt - 1) + jitter;
                await new Promise(resolve => setTimeout(resolve, delay));
              }

              // If we get here, all retries failed
              throw lastError || new Error('Login failed after multiple attempts');
            } catch (err) {
              // Map error types to user-friendly messages
              const errorMessage = {
                invalid_token: 'Google sign-in failed: Invalid or expired token',
                invalid_request: 'Google sign-in failed: Invalid request',
                network_error: 'Network error. Please check your connection and try again',
                server_error: 'Server error. Please try again later',
                default: 'Google sign-in failed. Please try again or use email/password'
              }[err.code] || err.message || 'An unexpected error occurred';

              toast?.push?.(errorMessage, { type: 'error' });
            } finally {
              setLoading(false);
            }
          }
        });

        // Render native button (if requested)
        try {
          if (renderNative) {
            const container = document.getElementById(containerId);
            if (container) {
              window.google.accounts.id.renderButton(container, { theme: 'outline', size: 'large' });
            }
          }
        } catch (e) {
          console.warn('renderButton failed', e);
          toast?.push?.('Failed to load Google sign-in button. Please try again later.', { type: 'error' });
        }

        // expose a prompt function to trigger the popup/prompt programmatically
        window.googleSignIn = () => {
          try {
            window.google.accounts.id.prompt();
          } catch (e) {
            console.warn('googleSignIn prompt failed', e);
            toast?.push?.('Failed to show Google sign-in prompt. Please try again.', { type: 'error' });
          }
        };
      } catch (err) {
        console.warn('Failed to load Google Identity script', err);
        toast?.push?.('Failed to load Google sign-in. Please try again later.', { type: 'error' });
      }
    };

    init();
    return () => {
      mounted = false;
      try { delete window.googleSignIn; } catch (e) { console.warn('cleanup googleSignIn failed', e); }
    };
  }, [login, navigate, redirectTo, onSuccess, containerId, renderNative, toast]);

  const handleClick = () => {
    // Prefer the programmatic prompt; if not available, attempt to open the GSI prompt
    if (window.googleSignIn) {
      window.googleSignIn();
      return;
    }
    // As a fallback, call prompt if available
    try {
      window.google?.accounts?.id?.prompt();
    } catch (e) {
      console.warn('Google prompt not available', e);
      toast?.push?.('Failed to show Google sign-in prompt. Please try again.', { type: 'error' });
    }
  };

  if (renderNative) {
    // If callers want the native button rendered by Google, provide a container and let GSI render into it.
    return (
      <div className={className}>
        <div id={containerId} />
        <GoogleSignInDebug className={className} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 p-2 rounded hover:bg-gray-50 transition-colors ${className}`}
    >
      <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
      {loading ? 'Signing in...' : buttonText}
    </button>
  );
};

export default GoogleSignIn;

GoogleSignIn.propTypes = {
  redirectTo: PropTypes.string,
  buttonText: PropTypes.string,
  className: PropTypes.string,
  renderNative: PropTypes.bool,
  onSuccess: PropTypes.func,
};
