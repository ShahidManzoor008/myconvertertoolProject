import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const withAuth = (WrappedComponent, options = { requireAdmin: false }) => {
  return function ProtectedRoute(props) {
    const { user, loading, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      if (!loading) {
        if (!isAuthenticated) {
          navigate('/login');
        } else if (options.requireAdmin && user?.role !== 'admin') {
          navigate('/'); // Redirect non-admin users
        }
      }
    }, [loading, isAuthenticated, user, navigate]);

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    // Only render the component if user is authenticated (and is admin if required)
    if (isAuthenticated && (!options.requireAdmin || user?.role === 'admin')) {
      return <WrappedComponent {...props} />;
    }

    return null; // Don't render anything while redirecting
  };
};