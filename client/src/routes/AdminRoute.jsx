import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';

// Check if user is authenticated and is an admin
const isAdmin = () => {
  // Replace this with your actual admin check logic
  return true;
};

// Protected route component
const AdminRoute = ({ children }) => {
  return isAdmin() ? children : <Navigate to="/login" replace />;
};

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AdminRoute;
