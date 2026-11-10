import { api } from './client';
import {
  asRecord,
  booleanValue,
  collectionFromPayload,
  numberValue,
  stringValue,
  unwrapData,
} from './normalizers';
import type {
  AdminUserDetail,
  AdminUserListItem,
  AdminUnitFormData,
  AdminUnitListItem,
  CatalogItem,
  CredentialTokenResult,
  RoleReference,
  RoutingRuleFormData,
  RoutingRuleListItem,
  TeamFormData,
  TeamListItem,
  TeamMember,
  UserFormData,
} from '../types/management';

const normalizeRole = (value: unknown): RoleReference | null => {
  const item = asRecord(value);
  if (!item) return null;
  const nestedRole = asRecord(item.role);
  const source = nestedRole ?? item;
  const id = stringValue(source.id, item.roleId, item.role_id);
  const name = stringValue(source.name, source.code);
  if (!id || !name) return null;
  return {
    id,
    name,
    code: stringValue(source.code),
    description: stringValue(source.description),
    active: booleanValue(source.isActive, source.is_active, source.active),
  };
};

const nestedArray = (item: Record<string, unknown>, ...keys: string[]): unknown[] => {
  for (const key of keys) {
    if (Array.isArray(item[key])) return item[key] as unknown[];
    const record = asRecord(item[key]);
    if (record) {
      for (const nestedKey of ['items', 'rows', 'results', 'members', 'roles', 'teams']) {
        if (Array.isArray(record[nestedKey])) return record[nestedKey] as unknown[];
      }
    }
  }
  return [];
};

const normalizeNamedList = (value: unknown): { id: string; name: string; email?: string }[] => {
  const list = Array.isArray(value) ? value : [];
  return list.flatMap((entry) => {
    const item = asRecord(entry);
    if (!item) return [];
    const source = asRecord(item.user) ?? asRecord(item.team) ?? item;
    const id = stringValue(source.id, item.userId, item.teamId);
    const name = stringValue(source.name, source.email);
    if (!id || !name) return [];
    const email = stringValue(source.email);
    return [email ? { id, name, email } : { id, name }];
  });
};

const normalizeUnitReference = (value: unknown) => {
  const item = asRecord(value);
  if (!item) return null;
  const nestedUnit = asRecord(item.unit);
  const source = nestedUnit ?? item;
  const id = stringValue(source.id, item.unitId, item.unit_id);
  const name = stringValue(source.name, source.code);
  if (!id || !name) return null;
  return {
    id,
    name,
    code: stringValue(source.code),
    active: booleanValue(source.isActive, source.is_active, source.active),
  };
};

const normalizeUser = (value: unknown): AdminUserListItem | null => {
  const item = asRecord(value);
  if (!item) return null;
  const id = stringValue(item.id);
  const email = stringValue(item.email);
  if (!id || !email) return null;
  const roles = nestedArray(item, 'roles', 'userRoles', 'user_roles')
    .map(normalizeRole)
    .filter((role): role is RoleReference => Boolean(role));
  const teams = normalizeNamedList(nestedArray(item, 'teams', 'teamMemberships', 'team_memberships'));
  const units = nestedArray(item, 'units', 'userUnits', 'user_units')
    .map(normalizeUnitReference)
    .filter((unit): unit is NonNullable<ReturnType<typeof normalizeUnitReference>> => Boolean(unit));
  return {
    id,
    name: stringValue(item.name) ?? email,
    email,
    active: booleanValue(item.isActive, item.is_active, item.active) ?? true,
    roles,
    units,
    teams,
    lastAccessAt: stringValue(item.lastLoginAt, item.last_login_at, item.lastAccessAt),
  };
};

const normalizeTeamMember = (value: unknown): TeamMember | null => {
  const item = asRecord(value);
  if (!item) return null;
  const id = stringValue(item.id, item.userId, item.user_id);
  const name = stringValue(item.name, item.email);
  const role = stringValue(item.teamRole, item.role);
  if (!id || !name || (role !== 'MEMBER' && role !== 'COORDINATOR')) return null;
  return {
    id,
    name,
    email: stringValue(item.email),
    teamRole: role,
    joinedAt: stringValue(item.joinedAt, item.joined_at),
  };
};

const normalizeTeam = (value: unknown): TeamListItem | null => {
  const item = asRecord(value);
  if (!item) return null;
  const id = stringValue(item.id);
  const name = stringValue(item.name);
  if (!id || !name) return null;
  const members = nestedArray(item, 'members')
    .map(normalizeTeamMember)
    .filter((member): member is TeamMember => Boolean(member));
  const units = nestedArray(item, 'units', 'teamUnits', 'team_units')
    .map(normalizeUnitReference)
    .filter((unit): unit is NonNullable<ReturnType<typeof normalizeUnitReference>> => Boolean(unit));
  return {
    id,
    name,
    description: stringValue(item.description) ?? null,
    isIndependent: booleanValue(item.isIndependent, item.is_independent) ?? false,
    active: booleanValue(item.isActive, item.is_active, item.active) ?? true,
    units,
    members,
    memberCount: members.length,
  };
};

const normalizeCatalogItem = (value: unknown): CatalogItem | null => {
  const item = asRecord(value);
  if (!item) return null;
  const id = stringValue(item.id, item.categoryId, item.unitId);
  const name = stringValue(item.name, item.code);
  if (!id || !name) return null;
  return {
    id,
    name,
    active: booleanValue(item.isActive, item.is_active, item.active) ?? true,
    code: stringValue(item.code, item.slug),
    description: stringValue(item.description),
    raw: value,
  };
};

const normalizeRoutingRule = (value: unknown): RoutingRuleListItem | null => {
  const item = asRecord(value);
  if (!item) return null;
  const id = stringValue(item.id);
  const name = stringValue(item.name);
  if (!id || !name) return null;

  const conditions = asRecord(item.conditions) ?? {};
  const actions = asRecord(item.actions) ?? {};
  const categoryId = stringValue(conditions.categoryId);
  const unitId = stringValue(conditions.unitId);
  const restrictedRoleId = stringValue(conditions.restrictedRoleId);
  const targetUserId = stringValue(actions.targetUserId);
  const targetTeamId = stringValue(actions.targetTeamId);
  const targetType: 'USER' | 'TEAM' | undefined = targetUserId ? 'USER' : targetTeamId ? 'TEAM' : undefined;
  const targetId = targetUserId ?? targetTeamId;

  return {
    id,
    name,
    active: booleanValue(item.isActive) ?? true,
    order: numberValue(item.priority),
    category: categoryId ? { id: categoryId, name: 'Categoria' } : undefined,
    unit: unitId ? { id: unitId, name: 'Unidade' } : undefined,
    reportMode: stringValue(conditions.reportMode),
    relationship: stringValue(conditions.relationshipType),
    immediateRisk: booleanValue(conditions.immediateRisk),
    restrictedRole: restrictedRoleId ? { id: restrictedRoleId, name: 'Perfil' } : undefined,
    targetType,
    target: targetId ? { id: targetId, name: targetType === 'TEAM' ? 'Equipe' : 'Usuário' } : undefined,
    setPriority: stringValue(actions.setPriority),
    stopProcessing: booleanValue(item.stopProcessing),
    raw: value,
  };
};

const tokenResult = (payload: unknown): CredentialTokenResult => {
  const root = asRecord(unwrapData(payload)) ?? {};
  const credentialSetup = asRecord(root.credentialSetup) ?? {};
  return {
    type: stringValue(credentialSetup.type),
    token: stringValue(credentialSetup.token),
    expiresAt: stringValue(credentialSetup.expiresAt),
    raw: payload,
  };
};

async function listAllUsers(): Promise<AdminUserListItem[]> {
  const limit = 100;
  const firstResponse = await api.get('/api/admin/users', { params: { page: 1, limit } });
  const firstRoot = asRecord(unwrapData(firstResponse.data)) ?? {};
  const firstItems = collectionFromPayload(firstResponse.data)
    .map(normalizeUser)
    .filter((item): item is AdminUserListItem => Boolean(item));
  const pagination = asRecord(firstRoot.pagination) ?? {};
  const totalPages = Math.max(1, numberValue(pagination.totalPages) ?? 1);
  if (totalPages <= 1) return firstItems;

  const remaining = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      api.get('/api/admin/users', { params: { page: index + 2, limit } }),
    ),
  );

  return [firstResponse, ...remaining].flatMap((response) =>
    collectionFromPayload(response.data)
      .map(normalizeUser)
      .filter((item): item is AdminUserListItem => Boolean(item)),
  );
}

export const usersApi = {
  list: listAllUsers,

  async assignableRoles(): Promise<RoleReference[]> {
    const parseRoles = (payload: unknown) => collectionFromPayload(payload)
      .map(normalizeRole)
      .filter((item): item is RoleReference => Boolean(item));

    const response = await api.get('/api/admin/users/assignable-roles');
    return parseRoles(response.data);
  },

  async get(id: string): Promise<AdminUserDetail> {
    const response = await api.get(`/api/admin/users/${id}`);
    const root = asRecord(unwrapData(response.data)) ?? {};
    const user = normalizeUser(root.user ?? root);
    if (!user) throw new Error('A API retornou um usuário em formato não reconhecido.');
    return { ...user, raw: response.data };
  },

  async create(data: UserFormData): Promise<CredentialTokenResult> {
    /*
     * O vínculo de unidades faz parte da criação. Isso é importante porque
     * o Responsável RH pode cadastrar alguém dentro do próprio escopo, mas
     * não pode usar a rota de transferência de unidades depois do cadastro.
     * A criação precisa ser atômica no backend.
     */
    const response = await api.post('/api/admin/users', {
      name: data.name.trim(),
      email: data.email.trim(),
      roleIds: data.roleIds,
      unitIds: data.unitIds,
    });

    return tokenResult(response.data);
  },

  async update(id: string, data: UserFormData, options: { updateUnits?: boolean } = {}): Promise<void> {
    await api.patch(`/api/admin/users/${id}`, { name: data.name.trim(), email: data.email.trim() });
    await api.put(`/api/admin/users/${id}/roles`, { roleIds: data.roleIds });
    if (options.updateUnits !== false) {
      await api.put(`/api/admin/users/${id}/units`, { unitIds: data.unitIds });
    }
  },

  async setStatus(id: string, active: boolean): Promise<void> {
    await api.patch(`/api/admin/users/${id}/status`, { isActive: active });
  },

  async resetPassword(id: string): Promise<CredentialTokenResult> {
    const response = await api.post(`/api/admin/users/${id}/reset-password`, {});
    return tokenResult(response.data);
  },
};

export const rolesApi = {
  async list(): Promise<RoleReference[]> {
    const response = await api.get('/api/admin/roles');
    return collectionFromPayload(response.data).map(normalizeRole).filter((item): item is RoleReference => Boolean(item));
  },
};

export const teamsApi = {
  async list(): Promise<TeamListItem[]> {
    const response = await api.get('/api/admin/teams');
    return collectionFromPayload(response.data).map(normalizeTeam).filter((item): item is TeamListItem => Boolean(item));
  },

  async get(id: string): Promise<TeamListItem> {
    const response = await api.get(`/api/admin/teams/${id}`);
    const root = asRecord(unwrapData(response.data)) ?? {};
    const team = normalizeTeam(root.team ?? root);
    if (!team) throw new Error('A API retornou uma equipe em formato não reconhecido.');
    return team;
  },

  async create(data: TeamFormData): Promise<void> {
    await api.post('/api/admin/teams', {
      name: data.name.trim(),
      description: data.description.trim() || null,
      isIndependent: data.isIndependent,
      unitIds: data.unitIds,
      members: data.members,
    });
  },

  async update(id: string, data: TeamFormData): Promise<void> {
    await api.patch(`/api/admin/teams/${id}`, {
      name: data.name.trim(),
      description: data.description.trim() || null,
      isIndependent: data.isIndependent,
    });
    await api.put(`/api/admin/teams/${id}/members`, { members: data.members });
    await api.put(`/api/admin/teams/${id}/units`, { unitIds: data.unitIds });
  },

  async setStatus(id: string, active: boolean): Promise<void> {
    await api.patch(`/api/admin/teams/${id}/status`, { isActive: active });
  },
};

const adminCategoriesPath = import.meta.env.VITE_ADMIN_CATEGORIES_PATH?.trim();

async function catalogList(publicPath: string, adminPath?: string): Promise<CatalogItem[]> {
  const response = await api.get(adminPath || publicPath);
  return collectionFromPayload(response.data).map(normalizeCatalogItem).filter((item): item is CatalogItem => Boolean(item));
}

async function catalogCreate(path: string | undefined, data: { name: string; code?: string; description?: string }): Promise<void> {
  if (!path) throw new Error('Endpoint administrativo de criação não configurado neste frontend.');
  await api.post(path, data);
}

async function catalogUpdate(path: string | undefined, id: string, data: { name: string; code?: string; description?: string }): Promise<void> {
  if (!path) throw new Error('Endpoint administrativo de edição não configurado neste frontend.');
  await api.patch(`${path}/${id}`, data);
}

async function catalogStatus(path: string | undefined, id: string, active: boolean): Promise<void> {
  if (!path) throw new Error('Endpoint administrativo de status não configurado neste frontend.');
  await api.patch(`${path}/${id}/status`, { isActive: active });
}

export const categoriesAdminApi = {
  configured: Boolean(adminCategoriesPath),
  list: () => catalogList('/api/public/report-categories', adminCategoriesPath),
  create: (data: { name: string; code?: string; description?: string }) => catalogCreate(adminCategoriesPath, data),
  update: (id: string, data: { name: string; code?: string; description?: string }) => catalogUpdate(adminCategoriesPath, id, data),
  setStatus: (id: string, active: boolean) => catalogStatus(adminCategoriesPath, id, active),
};

const normalizeAdminUnit = (value: unknown): AdminUnitListItem | null => {
  const item = asRecord(value);
  if (!item) return null;
  const id = stringValue(item.id);
  const name = stringValue(item.name);
  const code = stringValue(item.code);
  if (!id || !name || !code) return null;
  return {
    id,
    code,
    name,
    notificationEmail: stringValue(item.notificationEmail, item.notification_email) ?? '',
    active: booleanValue(item.isActive, item.is_active, item.active) ?? true,
    createdAt: stringValue(item.createdAt, item.created_at),
    updatedAt: stringValue(item.updatedAt, item.updated_at),
    raw: value,
  };
};

export const unitsAdminApi = {
  async list(): Promise<AdminUnitListItem[]> {
    const response = await api.get('/api/admin/units');
    return collectionFromPayload(response.data)
      .map(normalizeAdminUnit)
      .filter((item): item is AdminUnitListItem => Boolean(item));
  },

  async create(data: AdminUnitFormData): Promise<void> {
    await api.post('/api/admin/units', {
      name: data.name.trim(),
      notificationEmail: data.notificationEmail.trim().toLowerCase(),
    });
  },

  async update(id: string, data: AdminUnitFormData): Promise<void> {
    await api.patch(`/api/admin/units/${id}`, {
      name: data.name.trim(),
      notificationEmail: data.notificationEmail.trim().toLowerCase(),
    });
  },

  async setStatus(id: string, active: boolean): Promise<void> {
    await api.patch(`/api/admin/units/${id}/status`, { isActive: active });
  },
};

export const routingRulesApi = {
  async list(): Promise<RoutingRuleListItem[]> {
    const response = await api.get('/api/admin/routing-rules');
    return collectionFromPayload(response.data).map(normalizeRoutingRule).filter((item): item is RoutingRuleListItem => Boolean(item));
  },

  async get(id: string): Promise<RoutingRuleListItem> {
    const response = await api.get(`/api/admin/routing-rules/${id}`);
    const root = asRecord(unwrapData(response.data)) ?? {};
    const rule = normalizeRoutingRule(root.rule ?? root);
    if (!rule) throw new Error('A API retornou uma regra de roteamento em formato não reconhecido.');
    return rule;
  },

  async create(data: RoutingRuleFormData): Promise<void> {
    await api.post('/api/admin/routing-rules', routingPayload(data));
  },

  async update(id: string, data: RoutingRuleFormData): Promise<void> {
    await api.patch(`/api/admin/routing-rules/${id}`, routingPayload(data));
  },

  async setStatus(id: string, active: boolean): Promise<void> {
    await api.patch(`/api/admin/routing-rules/${id}/status`, { isActive: active });
  },
};

function routingPayload(data: RoutingRuleFormData) {
  return {
    name: data.name.trim(),
    priority: data.priority,
    categoryId: data.categoryId || null,
    unitId: data.unitId || null,
    reportMode: data.reportMode || null,
    relationshipType: data.relationship || null,
    immediateRisk: data.immediateRisk === '' ? null : data.immediateRisk === 'true',
    restrictedRoleId: data.restrictedRoleId || null,
    targetUserId: data.targetType === 'USER' ? data.targetId || null : null,
    targetTeamId: data.targetType === 'TEAM' ? data.targetId || null : null,
    setPriority: data.setPriority || null,
    stopProcessing: data.stopProcessing,
  };
}
