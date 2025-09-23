// Form validation rules
export const VALIDATION_RULES = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    minLength: 5,
    maxLength: 50,
    message: 'Please enter a valid email address'
  },
  password: {
    minLength: 8,
    maxLength: 100,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
    message: 'Password must be at least 8 characters and contain uppercase, lowercase, and numbers'
  },
  name: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s-']+$/,
    message: 'Name can only contain letters, spaces, hyphens, and apostrophes'
  },
  username: {
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9_-]+$/,
    message: 'Username can only contain letters, numbers, underscores, and hyphens'
  }
};

// Common error messages for API responses
export const ERROR_MESSAGES = {
  invalid_credentials: 'Invalid email or password',
  account_locked: 'Account locked. Please contact support',
  account_not_verified: 'Please verify your email address',
  rate_limit_exceeded: 'Too many login attempts. Please try again later',
  server_error: 'Server error. Please try again later',
  network_error: 'Network error. Please check your connection',
  validation_error: 'Please check your input and try again',
  user_exists: 'An account with this email already exists',
  weak_password: 'Password is too weak. Please choose a stronger password',
  invalid_token: 'Your session has expired. Please sign in again',
  unauthorized: 'You are not authorized to perform this action'
};

/**
 * Validates a field value against defined rules
 * @param {string} name - The field name to validate
 * @param {string} value - The value to validate
 * @returns {string} Empty string if valid, error message if invalid
 */
export const validateField = (name, value) => {
  const rules = VALIDATION_RULES[name];
  if (!rules) return '';

  if (value.length < rules.minLength) {
    return `Must be at least ${rules.minLength} characters`;
  }
  if (value.length > rules.maxLength) {
    return `Must be less than ${rules.maxLength} characters`;
  }
  if (!rules.pattern.test(value)) {
    return rules.message;
  }
  return '';
};

/**
 * Validates all fields in a form
 * @param {Object} formData - The form data to validate
 * @returns {Object} Object with field names as keys and error messages as values
 */
export const validateForm = (formData) => {
  const errors = {};
  Object.keys(formData).forEach(field => {
    if (VALIDATION_RULES[field]) {
      const error = validateField(field, formData[field]);
      if (error) errors[field] = error;
    }
  });
  return errors;
};

/**
 * Gets an appropriate error message for an API error
 * @param {Object} error - The error object from the API
 * @returns {string} A user-friendly error message
 */
export const getErrorMessage = (error) => {
  if (error.code && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code];
  }
  if (error.errors && Array.isArray(error.errors)) {
    return error.errors.map(e => e.msg).join(', ');
  }
  return error.message || 'An unexpected error occurred';
};

/**
 * Checks if a form has any validation errors
 * @param {Object} errors - The form errors object
 * @returns {boolean} True if the form has errors, false otherwise
 */
export const hasErrors = (errors) => {
  return Object.keys(errors).length > 0;
};

/**
 * Creates initial touched state for form fields
 * @param {Object} formData - The form data object
 * @returns {Object} An object with all fields set to false
 */
export const createInitialTouchedState = (formData) => {
  return Object.keys(formData).reduce((acc, field) => {
    acc[field] = false;
    return acc;
  }, {});
};

/**
 * Mark all fields in a form as touched
 * @param {Object} formData - The form data object
 * @returns {Object} An object with all fields set to true
 */
export const touchAllFields = (formData) => {
  return Object.keys(formData).reduce((acc, field) => {
    acc[field] = true;
    return acc;
  }, {});
};