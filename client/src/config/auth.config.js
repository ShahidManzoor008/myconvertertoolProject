// Google Identity Services (GIS) Configuration
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// No redirect URIs needed for GIS
// The flow is:
// 1. User clicks sign-in button
// 2. GIS shows popup/prompt
// 3. On success, we get ID token in the callback
// 4. Send ID token to backend for verification
// 5. Backend verifies with Google and issues our app's JWT