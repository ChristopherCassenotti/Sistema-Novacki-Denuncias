import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { LoadingScreen } from '../ui/LoadingScreen';
import { ErrorAlert } from '../ui/ErrorAlert';

export function ProtectedRoute() {
  const { loading, isAuthenticated, sessionExpired, sessionError } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen label="Validando sessão..." />;
  }


  if (sessionError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
        <div className="w-full max-w-2xl">
          <ErrorAlert
            error={sessionError}
            fallback="Não foi possível validar a sessão administrativa."
            showTechnicalDetails
            onRetry={() => window.location.reload()}
          />
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    if (sessionExpired) {
      return <Navigate to="/sessao-expirada" replace />;
    }

    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
