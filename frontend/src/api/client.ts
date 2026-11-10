import axios from 'axios';

const configuredBaseURL = import.meta.env.VITE_API_URL?.trim();
const baseURL = configuredBaseURL || (import.meta.env.DEV ? 'http://localhost:3000' : '');
export const AUTH_UNAUTHORIZED_EVENT = 'nvk:admin-session-unauthorized';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
  timeout: 20_000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? '';
      const isAdminRequest = url.includes('/api/admin/');
      const isLoginRequest = url.includes('/api/admin/auth/login');
      const isCredentialSetupRequest =
        url.includes('/api/admin/auth/change-initial-password') ||
        url.includes('/api/admin/auth/complete-credential-setup');

      if (isAdminRequest && !isLoginRequest && !isCredentialSetupRequest && typeof window !== 'undefined') {
        window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
      }
    }

    return Promise.reject(error);
  },
);
