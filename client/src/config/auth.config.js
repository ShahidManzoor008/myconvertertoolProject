// Read Google Client ID from Vite env (VITE_GOOGLE_CLIENT_ID) when available.
// When running locally, create `client/.env.local` with VITE_GOOGLE_CLIENT_ID or set the variable in your environment.
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';

// Google OAuth configuration
export const googleConfig = {
  client_id: GOOGLE_CLIENT_ID,
  scope: 'openid email profile',
};

// OAuth endpoints
export const authEndpoints = {
  google: 'https://accounts.google.com/o/oauth2/v2/auth',
  token: 'https://oauth2.googleapis.com/token',
};