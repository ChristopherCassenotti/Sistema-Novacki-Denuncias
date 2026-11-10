export type RoleReference = {
  id: string;
  name: string;
  code?: string;
  description?: string;
  active?: boolean;
};

export type UnitReference = {
  id: string;
  name: string;
  code?: string;
  active?: boolean;
};

export type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  roles: RoleReference[];
  units: UnitReference[];
  teams: { id: string; name: string }[];
  lastAccessAt?: string;
};

export type AdminUserDetail = AdminUserListItem & {
  raw?: unknown;
};

export type UserFormData = {
  name: string;
  email: string;
  roleIds: string[];
  unitIds: string[];
};

export type CredentialTokenResult = {
  type?: 'USER_INVITATION' | 'PASSWORD_RESET' | string;
  token?: string;
  expiresAt?: string;
  raw: unknown;
};

export type TeamMemberRole = 'MEMBER' | 'COORDINATOR';

export type TeamMember = {
  id: string;
  name: string;
  email?: string;
  teamRole: TeamMemberRole;
  joinedAt?: string;
};

export type TeamListItem = {
  id: string;
  name: string;
  description?: string | null;
  isIndependent: boolean;
  active: boolean;
  units: UnitReference[];
  members: TeamMember[];
  memberCount: number;
};

export type TeamFormData = {
  name: string;
  description: string;
  isIndependent: boolean;
  unitIds: string[];
  members: Array<{ userId: string; role: TeamMemberRole }>;
};

export type CatalogItem = {
  id: string;
  name: string;
  active: boolean;
  code?: string;
  description?: string;
  raw?: unknown;
};

export type AdminUnitListItem = {
  id: string;
  code: string;
  name: string;
  notificationEmail: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  raw?: unknown;
};

export type AdminUnitFormData = {
  name: string;
  notificationEmail: string;
};

export type RoutingRuleListItem = {
  id: string;
  name: string;
  active: boolean;
  order?: number;
  category?: { id: string; name: string };
  unit?: { id: string; name: string };
  reportMode?: string;
  relationship?: string;
  immediateRisk?: boolean;
  restrictedRole?: { id: string; name: string };
  targetType?: 'USER' | 'TEAM';
  target?: { id: string; name: string };
  setPriority?: string;
  stopProcessing?: boolean;
  raw?: unknown;
};

export type RoutingRuleFormData = {
  name: string;
  priority: number;
  categoryId: string;
  unitId: string;
  reportMode: string;
  relationship: string;
  immediateRisk: '' | 'true' | 'false';
  restrictedRoleId: string;
  targetType: '' | 'USER' | 'TEAM';
  targetId: string;
  setPriority: string;
  stopProcessing: boolean;
};
