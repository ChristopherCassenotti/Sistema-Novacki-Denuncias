import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { LoadingScreen } from '../ui/LoadingScreen';

export function GuestOnlyRoute() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingScreen label="Verificando acesso..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
