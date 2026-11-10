import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { authApi } from '../api/auth';
import { AUTH_UNAUTHORIZED_EVENT } from '../api/client';
import type { AccessContext, AdminUser, LoginCredentials, LoginResult } from '../types/auth';
import { toApiError } from '../utils/httpError';

type AuthState = {
  user: AdminUser | null;
  roles: string[];
  permissions: string[];
  loading: boolean;
  isAuthenticated: boolean;
  sessionExpired: boolean;
  sessionError: unknown | null;
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [sessionError, setSessionError] = useState<unknown | null>(null);
  const userRef = useRef<AdminUser | null>(null);

  const clearSessionState = useCallback(() => {
    userRef.current = null;
    setUser(null);
    setRoles([]);
    setPermissions([]);
  }, []);

  const applyAccessContext = useCallback((context: AccessContext) => {
    userRef.current = context.user;
    setUser(context.user);
    setRoles(context.roles);
    setPermissions(context.permissions);
  }, []);

  const refreshSession = useCallback(async () => {
    setSessionError(null);
    try {
      const accessContext = await authApi.accessMe();
      applyAccessContext(accessContext);
      return true;
    } catch (accessError) {
      try {

        const currentUser = await authApi.me();
        userRef.current = currentUser;
        setUser(currentUser);
        setRoles(currentUser.roles ?? []);
        setPermissions([]);
        return true;
      } catch (meError) {
        clearSessionState();
        const parsed = toApiError(meError);
        if (parsed.status !== 401) {
          setSessionError(meError ?? accessError);
        }
        return false;
      }
    }
  }, [applyAccessContext, clearSessionState]);

  useEffect(() => {
    const handleUnauthorized = () => {
      if (userRef.current) {
        setSessionExpired(true);
      }
      clearSessionState();
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [clearSessionState]);

  useEffect(() => {
    let active = true;

    const boot = async () => {
      setLoading(true);
      await refreshSession();
      if (active) setLoading(false);
    };

    void boot();

    return () => {
      active = false;
    };
  }, [refreshSession]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setSessionExpired(false);
      const result = await authApi.login(credentials);

      if (result.nextStep === 'CHANGE_PASSWORD') {
        return result;
      }

      await refreshSession();
      return result;
    },
    [refreshSession],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setSessionExpired(false);
      clearSessionState();
    }
  }, [clearSessionState]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      roles,
      permissions,
      loading,
      isAuthenticated: Boolean(user),
      sessionExpired,
      sessionError,
      login,
      logout,
      refreshSession,
    }),
    [user, roles, permissions, loading, sessionExpired, sessionError, login, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth precisa ser usado dentro de AuthProvider.');
  }

  return context;
}
