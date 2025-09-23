/**
 * Base Error class for all application errors
 */
export class AppError extends Error {
  /**
   * Create a new AppError
   * @param {string} message - Error message
   * @param {number} status - HTTP status code
   * @param {string} code - Error code for client handling
   * @param {any} details - Additional error details
   */
  constructor(message, status = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
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
        name: this.name,
        message: this.message,
        code: this.code,
        status: this.status,
        ...(this.details && { details: this.details }),
      },
    };
  }

  /**
   * Create AppError from API response
   * @param {Response} response - Fetch API Response object
   * @param {string} defaultMessage - Default error message
   * @returns {Promise<AppError>} Created AppError instance
   */
  static async fromResponse(response, defaultMessage = 'An error occurred') {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText || defaultMessage };
    }

    return new AppError(
      errorData.message,
      response.status,
      errorData.code || 'API_ERROR',
      errorData.details
    );
  }

  /**
   * Convert any error to AppError
   * @param {Error} error - Error to convert
   * @returns {AppError} Converted AppError instance
   */
  static fromError(error) {
    if (error instanceof AppError) {
      return error;
    }
    return new AppError(
      error.message || 'An unexpected error occurred',
      error.status || 500,
      error.code || 'INTERNAL_ERROR',
      error.details
    );
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Network error occurred', details = null) {
    super(message, 0, 'NETWORK_ERROR', details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', details = null) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied', details = null) {
    super(message, 403, 'AUTHORIZATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details = null) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details = null) {
    super(message, 409, 'CONFLICT', details);
  }
}

// File operation errors
export class FileProcessingError extends AppError {
  constructor(message = 'File processing failed', details = null) {
    super(message, 500, 'FILE_PROCESSING_ERROR', details);
  }
}

export class FileSizeError extends AppError {
  constructor(message = 'File size exceeds limit', details = null) {
    super(message, 400, 'FILE_SIZE_ERROR', details);
  }
}

export class FileTypeError extends AppError {
  constructor(message = 'Invalid file type', details = null) {
    super(message, 400, 'FILE_TYPE_ERROR', details);
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