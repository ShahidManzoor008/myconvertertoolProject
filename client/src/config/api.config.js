export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  DEFAULT_HEADERS: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
};

export const FILE_CONFIG = {
  MAX_SIZE: 75 * 1024 * 1024, // 75MB
  ALLOWED_TYPES: {
    pdf: ['application/pdf'],
    documents: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.oasis.opendocument.text',
      'text/markdown',
      'text/plain'
    ],
    images: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ]
  }
};

// Backwards-compatible exports:
// - default export remains the base URL string for files that import the default
// - keep named export API_CONFIG for modules that need the full config object
export const API_BASE_URL = API_CONFIG.BASE_URL;
export default API_BASE_URL;
// API_CONFIG is already a named export above, so no need to re-export it here.
