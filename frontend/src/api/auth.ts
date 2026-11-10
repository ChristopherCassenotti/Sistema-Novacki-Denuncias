import { api } from './client';
import type { AccessContext, AdminUser, LoginCredentials, LoginResult } from '../types/auth';

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as UnknownRecord;
  return null;
};

const normalizeLoginResponse = (payload: unknown): LoginResult => {
  const data = asRecord(payload);
  const nested = asRecord(data?.data);
  const source = nested ?? data;
  const nextStep = source?.nextStep ?? source?.next_step ?? source?.step;
  const preAuthToken = source?.preAuthToken ?? source?.pre_auth_token ?? source?.token;
  return {
    nextStep: typeof nextStep === 'string' ? nextStep : undefined,
    preAuthToken: typeof preAuthToken === 'string' ? preAuthToken : undefined,
    raw: payload,
  };
};

const normalizeUser = (payload: unknown): AdminUser => {
  const data = asRecord(payload);
  const nested = asRecord(data?.data);
  const possibleUser = asRecord(nested?.user) ?? asRecord(data?.user) ?? nested ?? data;
  if (!possibleUser) throw new Error('Resposta de usuário inválida.');
  const userRoles = possibleUser.roles ?? possibleUser.profiles;
  const userUnits = possibleUser.units ?? possibleUser.userUnits ?? possibleUser.user_units;
  return {
    id: String(possibleUser.id ?? ''),
    name: String(possibleUser.name ?? possibleUser.nome ?? 'Usuário'),
    email: String(possibleUser.email ?? ''),
    active:
      typeof possibleUser.isActive === 'boolean'
        ? possibleUser.isActive
        : typeof possibleUser.is_active === 'boolean'
          ? possibleUser.is_active
          : typeof possibleUser.active === 'boolean'
            ? possibleUser.active
            : undefined,
    roles: Array.isArray(userRoles)
      ? userRoles
          .map((role) =>
            typeof role === 'string' ? role : String(asRecord(role)?.code ?? asRecord(role)?.name ?? ''),
          )
          .filter(Boolean)
      : undefined,
    units: Array.isArray(userUnits)
      ? userUnits.flatMap((entry) => {
          const item = asRecord(entry);
          const unit = asRecord(item?.unit) ?? item;
          const id = unit?.id ?? item?.unitId ?? item?.unit_id;
          const name = unit?.name ?? unit?.code;
          if (typeof id !== 'string' || !id || typeof name !== 'string' || !name) return [];
          const code = typeof unit?.code === 'string' ? unit.code : undefined;
          return [{ id, name, ...(code ? { code } : {}) }];
        })
      : undefined,
  };
};

const normalizeAccessContext = (payload: unknown): AccessContext => {
  const data = asRecord(payload);
  const nested = asRecord(data?.data);
  const source = nested ?? data;
  const userSource = asRecord(source?.user);
  if (!source || !userSource) throw new Error('Resposta de contexto de acesso inválida.');
  const rolesRaw = source.roles ?? source.profiles;
  const permissionsRaw = source.permissions ?? source.effectivePermissions ?? source.effective_permissions;
  const normalizedUser = normalizeUser({ user: userSource });
  const contextUnits = source.units ?? source.userUnits ?? source.user_units;
  if ((!normalizedUser.units || normalizedUser.units.length === 0) && Array.isArray(contextUnits)) {
    normalizedUser.units = normalizeUser({ user: { ...userSource, units: contextUnits } }).units;
  }
  return {
    user: normalizedUser,
    roles: Array.isArray(rolesRaw)
      ? rolesRaw
          .map((role) =>
            typeof role === 'string' ? role : String(asRecord(role)?.code ?? asRecord(role)?.name ?? ''),
          )
          .filter(Boolean)
      : [],
    permissions: Array.isArray(permissionsRaw)
      ? permissionsRaw
          .map((permission) =>
            typeof permission === 'string'
              ? permission
              : String(asRecord(permission)?.code ?? asRecord(permission)?.name ?? ''),
          )
          .filter(Boolean)
      : [],
  };
};

export const authApi = {
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const response = await api.post('/api/admin/auth/login', credentials);
    return normalizeLoginResponse(response.data);
  },

  async me(): Promise<AdminUser> {
    const response = await api.get('/api/admin/auth/me');
    return normalizeUser(response.data);
  },

  async accessMe(): Promise<AccessContext> {
    const response = await api.get('/api/admin/access/me');
    return normalizeAccessContext(response.data);
  },

  async logout(): Promise<void> {
    await api.post('/api/admin/auth/logout');
  },

  async changeInitialPassword(payload: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> {
    await api.post(
      '/api/admin/auth/change-initial-password',
      { newPassword: payload.newPassword, confirmPassword: payload.confirmPassword },
      { headers: { Authorization: `Bearer ${payload.token}` } },
    );
  },

  async completeCredentialSetup(payload: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> {
    await api.post('/api/admin/auth/complete-credential-setup', payload);
  },
};
