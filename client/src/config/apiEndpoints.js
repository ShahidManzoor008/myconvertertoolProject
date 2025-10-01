const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  auth: {
    verify: `${window.API_BASE_URL}/api/auth/verify`,
    google: `${window.API_BASE_URL}/api/auth/google`,
    register: `${window.API_BASE_URL}/api/auth/register`,
    login: `${window.API_BASE_URL}/api/auth/login`,
    logout: `${window.API_BASE_URL}/api/auth/logout`,
    profile: `${window.API_BASE_URL}/api/auth/profile`,
  },
  blog: {
    posts: `${window.API_BASE_URL}/api/blog/posts`,
    post: (slug) => `${window.API_BASE_URL}/api/blog/posts/${slug}`,
    images: `${window.API_BASE_URL}/api/blog/images`,
  },
  pdf: {
    operations: `${window.API_BASE_URL}/api/pdf`,
    editor: `${window.API_BASE_URL}/api/edit-pdf`,
    converter: `${window.API_BASE_URL}/api/convert/upload`,
  },
  markdown: {
    toDocx: `${window.API_BASE_URL}/api/convert/md-to-docx`,
  },
  batch: {
    download: `${window.API_BASE_URL}/download-batch`,
  },
  admin: {
    users: `${window.API_BASE_URL}/api/admin/users`,
  }
};