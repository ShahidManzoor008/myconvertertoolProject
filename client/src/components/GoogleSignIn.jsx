import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getGoogleClientId } from '../config/auth.config';
import { loadGoogleIdentityScript } from '../utils/googleIdentity';

const GoogleSignIn = ({ redirectTo = '/', buttonText = 'Continue with Google', className = '', disabled = false, onSuccess }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const container = useRef(null);
  const handlers = useRef({ login, navigate, redirectTo, onSuccess });
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    handlers.current = { login, navigate, redirectTo, onSuccess };
  }, [login, navigate, redirectTo, onSuccess]);

  useEffect(() => {
    let disposed = false;
    setReady(false);
    setError('');
    const initialize = async () => {
      try {
        const clientId = await getGoogleClientId();
        await loadGoogleIdentityScript();
        if (disposed) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          auto_select: false,
          callback: async (response) => {
            if (disposed) return;
            if (!response?.credential) {
              setError('Google did not return a credential. Please try again.');
              return;
            }
            setLoading(true);
            setError('');
            try {
              const ok = await handlers.current.login({ tokenId: response.credential });
              if (!ok) throw new Error('Google sign-in failed. Please try again.');
              if (disposed) return;
              handlers.current.onSuccess?.();
              if (handlers.current.redirectTo) handlers.current.navigate(handlers.current.redirectTo);
            } catch (err) {
              if (!disposed) setError(err.message || 'Google sign-in failed. Please try again.');
            } finally {
              if (!disposed) setLoading(false);
            }
          }
        });
        container.current.replaceChildren();
        window.google.accounts.id.renderButton(container.current, { theme: 'outline', size: 'large' });
        setReady(true);
      } catch (err) {
        if (!disposed) setError(err.message || 'Google sign-in is temporarily unavailable.');
      }
    };
    initialize();
    return () => { disposed = true; };
  }, [attempt]);

  return (
    <div className={className} aria-label={buttonText} aria-busy={loading || (!ready && !error)}>
      {!ready && !error && <p role="status">Loading Google sign-in…</p>}
      <div inert={disabled || loading ? true : undefined} className={disabled || loading ? 'opacity-60 pointer-events-none' : ''}>
        <div ref={container} />
      </div>
      {loading && <p role="status">Signing in…</p>}
      {error && (
        <div className="mt-3 text-sm text-red-600 dark:text-red-400">
          <p role="alert">{error}</p>
          {!ready && <button type="button" onClick={() => setAttempt(value => value + 1)} className="mt-2 underline">Try again</button>}
        </div>
      )}
    </div>
  );
};

GoogleSignIn.propTypes = {
  redirectTo: PropTypes.string,
  buttonText: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  onSuccess: PropTypes.func,
};

export default GoogleSignIn;
