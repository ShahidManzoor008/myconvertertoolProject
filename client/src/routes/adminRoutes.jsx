import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/layouts/AdminLayout';
import AdminRoute from './AdminRoute'; // Import the new AdminRoute component

// Lazy load admin pages
const Dashboard = lazy(() => import('../pages/admin/Dashboard'));
const BlogManagement = lazy(() => import('../pages/admin/BlogManagement'));
const EditBlogPost = lazy(() => import('../pages/admin/EditBlogPost'));

const adminRoutes = (
  <Route path="admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="posts" element={<BlogManagement />} />
    <Route path="posts/new" element={<EditBlogPost />} />
    <Route path="posts/:id/edit" element={<EditBlogPost />} />
  </Route>
);

export default adminRoutes;