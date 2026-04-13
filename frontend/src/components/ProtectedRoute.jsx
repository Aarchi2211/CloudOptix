import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getAuthToken } from '../utils/auth';

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!getAuthToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children || <Outlet />;
}
