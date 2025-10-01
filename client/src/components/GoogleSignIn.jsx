import { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { GOOGLE_CLIENT_ID } from '../config/auth.config';
import { GOOGLE_AUTH_ERROR_MESSAGES } from '../utils/googleAuthErrors';
import GoogleSignInDebug from './GoogleSignInDebug';
import useToast from '../hooks/useToast';


const GoogleSignIn = ({ redirectTo = '/', buttonText = 'Continue with Google', className = '', renderNative = true, onSuccess }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [containerId] = useState(() => `gsi-button-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    let mounted = true;

    const init = () => {
      if (!window.google) {
        console.warn('[GSI] Google script not loaded yet');
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        auto_select: true,
        use_cookies: true,
        callback: async (res) => {
          if (!res?.credential) {
            return;
          }

          setLoading(true);
          try {
            const ok = await login({ tokenId: res.credential });
            if (ok) {
              onSuccess?.();
              if (redirectTo) navigate(redirectTo);
            }
          } catch (err) {
            const errorMessage = GOOGLE_AUTH_ERROR_MESSAGES[err.code] || err.message || 'An unexpected error occurred';
            toast?.push?.(errorMessage, { type: 'error' });
          } finally {
            setLoading(false);
          }
        }
      });

      if (renderNative) {
        const container = document.getElementById(containerId);
        if (container) {
          window.google.accounts.id.renderButton(container, { theme: 'outline', size: 'large' });
        }
      }

      window.googleSignIn = () => {
        try {
          window.google.accounts.id.prompt();
        } catch (e) {
          console.warn('googleSignIn prompt failed', e);
        }
      };
    };

    if (document.readyState === 'complete') {
      init();
    } else {
      window.addEventListener('load', init);
    }

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
        {import.meta.env.DEV && <GoogleSignInDebug className={className} />}
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
