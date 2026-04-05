import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate replace to="/chats" />;
  }

  return <Outlet />;
}

export default AuthLayout;
