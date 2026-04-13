import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getAuthToken, getAuthUser } from '../utils/auth';

export default function AdminRoute({ children }) {
  const location = useLocation();
  const token = getAuthToken();
  const user = getAuthUser();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user?.role !== 'Admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children || <Outlet />;
}
