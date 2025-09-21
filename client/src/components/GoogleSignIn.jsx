import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { GOOGLE_CLIENT_ID } from '../config/auth.config';
import API_BASE_URL from '../config/api.config';
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

              const ok = await login({ tokenId: res.credential });
              console.debug('[GSI] login() returned', ok);
              if (ok) {
                onSuccess?.();
                if (redirectTo) navigate(redirectTo);
              } else {
                console.warn('[GSI] login returned falsy, token exchange may have failed');
                toast?.push?.('Google login failed: token exchange was not successful. Please try again or use email/password.', { type: 'error' });
              }
            } catch (err) {
              console.error('GoogleSignIn login failed', err);
              toast?.push?.('Google login failed: ' + (err?.message || 'unknown error'), { type: 'error' });
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
        }

        // expose a prompt function to trigger the popup/prompt programmatically
        window.googleSignIn = () => {
          try {
            window.google.accounts.id.prompt();
          } catch (e) {
            console.warn('googleSignIn prompt failed', e);
          }
        };
      } catch (err) {
        console.warn('Failed to load Google Identity script', err);
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
    }
  };

  if (renderNative) {
    // If callers want the native button rendered by Google, provide a container and let GSI render into it.
    return (
      <div className={className}>
        <div id={containerId} />
        {import.meta.env.MODE !== 'production' && (
          <div className="mt-2 text-xs text-gray-500">
            <details>
              <summary className="cursor-pointer">Debug: Manual token exchange</summary>
              <p className="mt-2">Paste an ID token here to POST to /api/auth/google for debugging.</p>
              <textarea id="gsi-debug-token" className="w-full p-2 border rounded mt-1" rows={3} />
              <div className="flex gap-2 mt-2">
                <button type="button" className="bg-gray-200 p-1 rounded" onClick={async () => {
                  const token = document.getElementById('gsi-debug-token')?.value?.trim();
                  if (!token) return toast?.push?.('Paste a token into the textarea', { type: 'info' });

                  // Simple retry/backoff
                  const maxAttempts = 3;
                  let attempt = 0;
                  let lastErr = null;
                  while (attempt < maxAttempts) {
                    attempt += 1;
                    try {
                      const res = await fetch(`${API_BASE_URL}/api/auth/google`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
                      const j = await res.json().catch(() => ({}));
                      console.log('Manual exchange result', res.ok, j);
                      if (res.ok) {
                        toast?.push?.('Manual exchange succeeded - check localStorage for auth_token', { type: 'success' });
                        break;
                      } else {
                        lastErr = j?.error || JSON.stringify(j);
                        // If 4xx, don't retry
                        if (res.status >= 400 && res.status < 500) {
                          toast?.push?.('Manual exchange failed: ' + lastErr, { type: 'error' });
                          break;
                        }
                      }
                    } catch (e) {
                      console.error('Manual exchange attempt failed', attempt, e);
                      lastErr = e?.message || String(e);
                    }
                    // backoff
                    await new Promise(r => setTimeout(r, 500 * attempt));
                  }
                  if (attempt >= maxAttempts && lastErr) {
                    toast?.push?.('Manual exchange failed after retries: ' + lastErr, { type: 'error' });
                  }
                }}>Exchange token</button>
              </div>
            </details>
          </div>
        )}
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
