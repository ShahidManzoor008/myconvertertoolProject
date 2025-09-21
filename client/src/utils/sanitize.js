import DOMPurify from 'dompurify';

// Configure DOMPurify with strict options
const config = {
  ALLOWED_TAGS: [
    'b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 
    'li', 'br', 'span', 'div', 'h1', 'h2', 'h3', 'h4'
  ],
  ALLOWED_ATTR: ['href', 'target', 'class', 'id'],
  ALLOW_DATA_ATTR: false,
  ADD_ATTR_CHECK: true,
  USE_PROFILES: { html: true }
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} content - The content to sanitize
 * @param {boolean} allowHtml - Whether to allow HTML tags (default: false)
 * @returns {string} Sanitized content
 */
export const sanitize = (content, allowHtml = false) => {
  if (!content) return '';
  
  if (!allowHtml) {
    // If HTML is not allowed, escape all HTML
    return content.replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }
  
  // If HTML is allowed, use DOMPurify with strict configuration
  return DOMPurify.sanitize(content, config);
};

/**
 * Sanitize an object's string values recursively
 * @param {Object} obj - The object to sanitize
 * @param {boolean} allowHtml - Whether to allow HTML tags
 * @returns {Object} New object with sanitized values
 */
export const sanitizeObject = (obj, allowHtml = false) => {
  if (!obj || typeof obj !== 'object') return obj;

  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    if (typeof value === 'string') {
      acc[key] = sanitize(value, allowHtml);
    } else if (typeof value === 'object' && value !== null) {
      acc[key] = sanitizeObject(value, allowHtml);
    } else {
      acc[key] = value;
    }
    return acc;
  }, Array.isArray(obj) ? [] : {});
};