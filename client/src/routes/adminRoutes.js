import { lazy } from 'react';

const Dashboard = lazy(() => import('../pages/admin/Dashboard'));
const Users = lazy(() => import('../pages/admin/Users'));
const Posts = lazy(() => import('../pages/admin/Posts'));
const Tools = lazy(() => import('../pages/admin/Tools'));
const Analytics = lazy(() => import('../pages/admin/Analytics'));
const Settings = lazy(() => import('../pages/admin/Settings'));

export const adminRoutes = [
  {
    path: '/admin',
    element: Dashboard,
    exact: true
  },
  {
    path: '/admin/users',
    element: Users
  },
  {
    path: '/admin/posts',
    element: Posts
  },
  {
    path: '/admin/tools',
    element: Tools
  },
  {
    path: '/admin/analytics',
    element: Analytics
  },
  {
    path: '/admin/settings',
    element: Settings
  }
];