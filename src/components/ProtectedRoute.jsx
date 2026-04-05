// Protected route component that requires authentication
// This component checks if the user is authenticated and redirects to login if not
// It also shows a loading state while authentication is being verified

import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="glass-panel px-6 py-4 text-sm text-slate-200">Loading workspace...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated, preserving the current location
  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  // Render children if authenticated
  return children;
}

export default ProtectedRoute;
