/**
 * Base Error class for all server-side application errors
 */
class AppError extends Error {
  /**
   * Create a new AppError
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Error code for client handling
   * @param {any} details - Additional error details
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON format
   * @returns {Object} JSON representation of error
   */
  toJSON() {
    return {
      error: {
        message: this.message,
        code: this.code,
        status: this.status,
        statusCode: this.statusCode,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

/**
 * Check if an error is operational (expected)
 * @param {Error} error - Error to check
 * @returns {boolean} True if error is operational
 */
export const isOperationalError = (error) => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Error class for validation errors
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * Error class for authentication errors
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', details = null) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
  }
}

/**
 * Error class for authorization errors
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Access denied', details = null) {
    super(message, 403, 'AUTHORIZATION_ERROR', details);
  }
}

/**
 * Error class for not found errors
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details = null) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

/**
 * Error class for conflict errors
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details = null) {
    super(message, 409, 'CONFLICT', details);
  }
}

/**
 * Error class for file processing errors
 */
export class FileProcessingError extends AppError {
  constructor(message = 'File processing failed', details = null) {
    super(message, 500, 'FILE_PROCESSING_ERROR', details);
  }
}

/**
 * Error class for file size errors
 */
export class FileSizeError extends AppError {
  constructor(message = 'File size exceeds limit', details = null) {
    super(message, 400, 'FILE_SIZE_ERROR', details);
  }
}

/**
 * Error class for file type errors
 */
export class FileTypeError extends AppError {
  constructor(message = 'Invalid file type', details = null) {
    super(message, 400, 'FILE_TYPE_ERROR', details);
  }
}

export default AppError;