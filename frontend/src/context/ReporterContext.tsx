import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { publicReportsApi } from '../api/publicReports';
import type { PublicReport } from '../types/public';
import { toApiError } from '../utils/httpError';

const SESSION_FLAG = 'nvk:reporter-session-active';
const PROTOCOL_KEY = 'nvk:reporter-protocol';

type ReporterContextValue = {
  report: PublicReport | null;
  loading: boolean;
  isAuthenticated: boolean;
  protocol: string | null;
  sessionError: unknown | null;
  accessReport: (protocol: string, secret: string) => Promise<PublicReport>;
  ensureSession: () => Promise<boolean>;
  refreshReport: () => Promise<PublicReport>;
  logoutReporter: () => Promise<void>;
};

const ReporterContext = createContext<ReporterContextValue | null>(null);

export function ReporterProvider({ children }: PropsWithChildren) {
  const [report, setReport] = useState<PublicReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [protocol, setProtocol] = useState<string | null>(() => sessionStorage.getItem(PROTOCOL_KEY));
  const [sessionError, setSessionError] = useState<unknown | null>(null);

  const refreshReport = useCallback(async () => {
    const current = await publicReportsApi.current();
    setReport(current);
    if (current.protocol) {
      setProtocol(current.protocol);
      sessionStorage.setItem(PROTOCOL_KEY, current.protocol);
    }
    sessionStorage.setItem(SESSION_FLAG, '1');
    return current;
  }, []);

  const accessReport = useCallback(
    async (reportProtocol: string, secret: string) => {
      setLoading(true);
      setSessionError(null);
      try {
        await publicReportsApi.access(reportProtocol.trim(), secret.trim());
        sessionStorage.setItem(SESSION_FLAG, '1');
        sessionStorage.setItem(PROTOCOL_KEY, reportProtocol.trim());
        setProtocol(reportProtocol.trim());
        return await refreshReport();
      } finally {
        setLoading(false);
      }
    },
    [refreshReport],
  );

  const ensureSession = useCallback(async () => {
    if (report) return true;
    if (sessionStorage.getItem(SESSION_FLAG) !== '1') return false;

    setLoading(true);
    setSessionError(null);
    try {
      await refreshReport();
      return true;
    } catch (error) {
      const parsed = toApiError(error);
      if (parsed.status === 401 || parsed.status === 403) {
        sessionStorage.removeItem(SESSION_FLAG);
        sessionStorage.removeItem(PROTOCOL_KEY);
        setReport(null);
        setProtocol(null);
      } else {
        setSessionError(error);
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [refreshReport, report]);

  const logoutReporter = useCallback(async () => {
    try {
      await publicReportsApi.logout();
    } finally {
      sessionStorage.removeItem(SESSION_FLAG);
      sessionStorage.removeItem(PROTOCOL_KEY);
      setReport(null);
      setProtocol(null);
    }
  }, []);

  const value = useMemo<ReporterContextValue>(
    () => ({
      report,
      loading,
      isAuthenticated: Boolean(report),
      protocol,
      sessionError,
      accessReport,
      ensureSession,
      refreshReport,
      logoutReporter,
    }),
    [report, loading, protocol, sessionError, accessReport, ensureSession, refreshReport, logoutReporter],
  );

  return <ReporterContext.Provider value={value}>{children}</ReporterContext.Provider>;
}

export function useReporter() {
  const context = useContext(ReporterContext);
  if (!context) throw new Error('useReporter precisa ser usado dentro de ReporterProvider.');
  return context;
}
