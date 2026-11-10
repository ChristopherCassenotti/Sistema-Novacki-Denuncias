import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useReporter } from '../../context/ReporterContext';
import { LoadingScreen } from '../ui/LoadingScreen';
import { ErrorAlert } from '../ui/ErrorAlert';

export function ReporterProtectedRoute() {
  const { report, ensureSession, sessionError } = useReporter();
  const location = useLocation();
  const [checking, setChecking] = useState(!report);
  const [allowed, setAllowed] = useState(Boolean(report));

  useEffect(() => {
    let active = true;
    if (report) {
      setAllowed(true);
      setChecking(false);
      return () => {
        active = false;
      };
    }

    void ensureSession().then((ok) => {
      if (!active) return;
      setAllowed(ok);
      setChecking(false);
    });

    return () => {
      active = false;
    };
  }, [ensureSession, report]);

  if (checking) return <LoadingScreen label="Validando acesso à denúncia..." />;
  if (sessionError) return <div className="mx-auto w-full max-w-3xl px-5 py-10"><ErrorAlert error={sessionError} fallback="Não foi possível validar o acesso à denúncia." onRetry={() => { setChecking(true); void ensureSession().then((ok) => { setAllowed(ok); setChecking(false); }); }} /></div>;
  if (!allowed) return <Navigate to="/acompanhar" replace state={{ from: location }} />;
  return <Outlet />;
}
