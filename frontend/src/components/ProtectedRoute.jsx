import { Navigate, Outlet } from 'react-router-dom';
import { getAuthToken } from '../utils/auth';

export default function ProtectedRoute({ children }) {
  const token = getAuthToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
}