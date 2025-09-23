import PropTypes from 'prop-types';
import API_BASE_URL from '../config/api.config';
import useToast from '../hooks/useToast';

const GoogleSignInDebug = ({ className }) => {
  const toast = useToast();

  /**
   * Performs a manual token exchange with retry logic
   * @param {string} token - The Google ID token to exchange
   * @returns {Promise<boolean>} True if exchange succeeded, false otherwise
   */
  const exchangeToken = async (token) => {
    const maxAttempts = 3;
    const baseDelay = 500; // 500ms base delay
    let attempt = 0;
    let lastError = null;

    while (attempt < maxAttempts) {
      attempt += 1;
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });

        const data = await res.json().catch(() => ({}));
        console.log('Manual exchange attempt', attempt, 'result:', res.ok, data);

        if (res.ok) {
          toast?.push?.('Manual exchange succeeded - check localStorage for auth_token', {
            type: 'success'
          });
          return true;
        }

        lastError = data?.error || JSON.stringify(data);
        // Don't retry 4xx errors (client errors)
        if (res.status >= 400 && res.status < 500) {
          toast?.push?.('Manual exchange failed: ' + lastError, {
            type: 'error'
          });
          return false;
        }
      } catch (err) {
        console.error('Manual exchange attempt failed', attempt, err);
        lastError = err?.message || String(err);
      }

      // Exponential backoff with jitter
      const jitter = Math.random() * 200; // Random delay between 0-200ms
      const delay = baseDelay * Math.pow(2, attempt - 1) + jitter;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    if (lastError) {
      toast?.push?.('Manual exchange failed after retries: ' + lastError, {
        type: 'error'
      });
    }
    return false;
  };

  if (import.meta.env.MODE === 'production') return null;

  return (
    <div className={`mt-2 text-xs text-gray-500 ${className}`}>
      <details>
        <summary className="cursor-pointer">Debug: Manual token exchange</summary>
        <p className="mt-2">
          Paste an ID token here to POST to /api/auth/google for debugging.
        </p>
        <textarea
          id="gsi-debug-token"
          className="w-full p-2 border rounded mt-1"
          rows={3}
        />
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            className="bg-gray-200 p-1 rounded"
            onClick={async () => {
              const token = document.getElementById('gsi-debug-token')?.value?.trim();
              if (!token) {
                toast?.push?.('Paste a token into the textarea', { type: 'info' });
                return;
              }
              await exchangeToken(token);
            }}
          >
            Exchange token
          </button>
        </div>
      </details>
    </div>
  );
};

GoogleSignInDebug.propTypes = {
  className: PropTypes.string,
};

export default GoogleSignInDebug;