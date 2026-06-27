import { API_ENDPOINTS } from '../config/apiEndpoints';
import { 
  AppError,
  NetworkError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError
} from './AppError';

/**
 * Get headers with authentication token if available
 * @returns {Object} Headers object with auth token if present
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/**
 * Create error instance based on response status
 * @param {Response} response - Fetch response object
 * @param {Object} data - Error data from response
 * @returns {AppError} Appropriate error instance
 */
const createError = (response, data) => {
  const message = data?.message || response.statusText;
  const details = data?.details || null;

  switch (response.status) {
    case 400:
      return new ValidationError(message, details);
    case 401:
      return new AuthenticationError(message, details);
    case 403:
      return new AuthorizationError(message, details);
    case 404:
      return new NotFoundError(message, details);
    case 409:
      return new ConflictError(message, details);
    default:
      return new AppError(message, response.status, response.statusText, details);
  }
};

export const apiClient = {
  /**
   * Make a GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<any>} Response data
   */
  async get(endpoint, options = {}) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          ...options.headers,
        },
        credentials: 'include',
        ...options,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw createError(response, data);
      }

      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new NetworkError('Network request failed', { endpoint, error: error.message });
    }
  },

  /**
   * Make a POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Fetch options
   * @returns {Promise<any>} Response data
   */
  async post(endpoint, data, options = {}) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          ...options.headers,
        },
        body: JSON.stringify(data),
        credentials: 'include',
        ...options,
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw createError(response, responseData);
      }

      return responseData;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new NetworkError('Network request failed', { endpoint, error: error.message });
    }
  },

  /**
   * Make a PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Fetch options
   * @returns {Promise<any>} Response data
   */
  async put(endpoint, data, options = {}) {
    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          ...options.headers,
        },
        body: JSON.stringify(data),
        credentials: 'include',
        ...options,
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw createError(response, responseData);
      }

      return responseData;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new NetworkError('Network request failed', { endpoint, error: error.message });
    }
  },

  /**
   * Make a DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<any>} Response data
   */
  async delete(endpoint, options = {}) {
    try {
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
          ...options.headers,
        },
        credentials: 'include',
        ...options,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw createError(response, data);
      }

      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new NetworkError('Network request failed', { endpoint, error: error.message });
    }
  },

  /**
   * Upload file(s) using FormData
   * @param {string} endpoint - API endpoint
   * @param {FormData} formData - Form data with files
   * @param {Object} options - Fetch options
   * @returns {Promise<any>} Response data
   */
  async upload(endpoint, formData, options = {}) {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include',
        ...options,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw createError(response, data);
      }

      // Handle blob response for file downloads
      if (options.responseType === 'blob') {
        return response.blob();
      }

      const data = await response.json().catch(() => null);
      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new NetworkError('Upload failed', { endpoint, error: error.message });
    }
  },

  /**
   * Download file from endpoint
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Blob>} File blob
   */
  async download(endpoint, options = {}) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
        ...options,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw createError(response, data);
      }

      return response.blob();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new NetworkError('Download failed', { endpoint, error: error.message });
    }
  },
};

// API service functions
export const authApi = {
  verify: () => apiClient.get(API_ENDPOINTS.auth.verify),
  login: (credentials) => apiClient.post(API_ENDPOINTS.auth.login, credentials),
  register: (userData) => apiClient.post(API_ENDPOINTS.auth.register, userData),
  googleAuth: (token) => apiClient.post(API_ENDPOINTS.auth.google, { token }),
  logout: () => apiClient.post(API_ENDPOINTS.auth.logout),
  getProfile: () => apiClient.get(API_ENDPOINTS.auth.profile),
};

export const blogApi = {
  getPosts: (page = 1, limit = 9) => 
    apiClient.get(`${API_ENDPOINTS.blog.posts}?page=${page}&limit=${limit}`),
  getPost: (slug) => apiClient.get(API_ENDPOINTS.blog.post(slug)),
  uploadImage: (formData) => apiClient.upload(API_ENDPOINTS.blog.images, formData),
};

export const pdfApi = {
  convert: (formData, options = {}) => apiClient.upload(API_ENDPOINTS.pdf.converter, formData, options),
  edit: (formData, options = {}) => apiClient.upload(API_ENDPOINTS.pdf.editor, formData, options),
  download: (fileId) => apiClient.download(`${API_ENDPOINTS.pdf.operations}/${fileId}`),
};

export const markdownApi = {
  convertToDocx: (formData) => apiClient.upload(API_ENDPOINTS.markdown.toDocx, formData),
};

export const batchApi = {
  download: (files) => apiClient.post(API_ENDPOINTS.batch.download, { files }),
};

export const mdToDocxApi = {
  convert: (formData) => apiClient.upload(API_ENDPOINTS.markdown.toDocx, formData, { responseType: 'blob' }),
};

export const statsApi = {
  getTotal: () => apiClient.get(API_ENDPOINTS.stats.total),
  increment: (data) => apiClient.post(API_ENDPOINTS.stats.increment, data),
};

export const adminApi = {
  getStats: () => apiClient.get(API_ENDPOINTS.admin.stats),
  getUsers: (page = 1, limit = 20) => 
    apiClient.get(`${API_ENDPOINTS.admin.users}?page=${page}&limit=${limit}`),
  updateUser: (id, userData) => apiClient.put(`${API_ENDPOINTS.admin.users}/${id}`, userData),
  deleteUser: (id) => apiClient.delete(`${API_ENDPOINTS.admin.users}/${id}`),
  };
