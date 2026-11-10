import { Navigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { adminLandingPath } from '../../utils/authorization';
import { DashboardPage } from './DashboardPage';

export function AdminIndexPage() {
  const { permissions } = useAuth();
  const destination = adminLandingPath(permissions);
  return destination === '/admin' ? <DashboardPage /> : <Navigate to={destination} replace />;
}
