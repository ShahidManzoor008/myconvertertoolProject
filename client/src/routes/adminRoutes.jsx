import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/layouts/AdminLayout';
import AdminRoute from './AdminRoute'; // Import the new AdminRoute component

// Lazy load admin pages
const Dashboard = lazy(() => import('../pages/admin/Dashboard'));
const BlogManagement = lazy(() => import('../pages/admin/BlogManagement'));
const EditBlogPost = lazy(() => import('../pages/admin/EditBlogPost'));
const Settings = lazy(() => import('../pages/admin/Settings'));
const Users = lazy(() => import('../pages/admin/Users'));

const adminRoutes = (
  <Route path="admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="posts">
      <Route index element={<BlogManagement />} />
      <Route path="new" element={<EditBlogPost />} />
      <Route path=":id/edit" element={<EditBlogPost />} />
    </Route>
    <Route path="settings" element={<Settings />} />
    <Route path="users" element={<Users />} />
  </Route>
);

export default adminRoutes;