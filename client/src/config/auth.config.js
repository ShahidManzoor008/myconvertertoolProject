import { authApi } from '../utils/apiClient';

// Fetch the same public client ID the server uses to verify credentials.
// No build-time VITE_GOOGLE_CLIENT_ID is required.
export async function getGoogleClientId() {
  const { googleClientId } = await authApi.getConfig();
  if (!/^\d+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(googleClientId || '')) {
    throw new Error('Google sign-in is temporarily unavailable.');
  }
  return googleClientId;
}
