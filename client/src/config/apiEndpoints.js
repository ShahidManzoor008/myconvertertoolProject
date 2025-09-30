import { API_CONFIG } from './api.config';

const API_BASE_URL = API_CONFIG?.BASE_URL || '';

export const API_ENDPOINTS = {
  auth: {
    verify: `${API_BASE_URL}/api/auth/verify`,
    google: `${API_BASE_URL}/api/auth/google`,
    register: `${API_BASE_URL}/api/auth/register`,
    login: `${API_BASE_URL}/api/auth/login`,
    logout: `${API_BASE_URL}/api/auth/logout`,
    profile: `${API_BASE_URL}/api/auth/profile`,
  },
  blog: {
    posts: `${API_BASE_URL}/api/blog/posts`,
    post: (slug) => `${API_BASE_URL}/api/blog/posts/${slug}`,
    images: `${API_BASE_URL}/api/blog/images`,
  },
  pdf: {
    operations: `${API_BASE_URL}/api/pdf`,
    editor: `${API_BASE_URL}/api/edit-pdf`,
    converter: `${API_BASE_URL}/api/convert/upload`,
  },
  markdown: {
    toDocx: `${API_BASE_URL}/api/convert/md-to-docx`,
  },
  batch: {
    download: `${API_BASE_URL}/download-batch`,
  },
  admin: {
    users: `${API_BASE_URL}/api/admin/users`,
  }
};