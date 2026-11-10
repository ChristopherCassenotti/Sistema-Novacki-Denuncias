export type PermissionCheck = {
  permission?: string;
  anyOf?: readonly string[];
  allOf?: readonly string[];
};

/** Effective permissions from access/me; role names never grant permissions. */
export function can(permissions: readonly string[], check: PermissionCheck): boolean {
  const granted = new Set(permissions);
  return (!check.permission || granted.has(check.permission))
    && (!check.anyOf?.length || check.anyOf.some((code) => granted.has(code)))
    && (!check.allOf?.length || check.allOf.every((code) => granted.has(code)));
}

// Mirrors API middleware. See docs/rbac.md for the dashboard mismatch.
export const ACCESS = {
  dashboard: { permission: 'REPORT_DASHBOARD_VIEW' },
  reports: { permission: 'REPORT_LIST' },
  reportDetail: { permission: 'REPORT_VIEW' },
  users: { permission: 'USER_MANAGE' },
  teams: { permission: 'TEAM_MANAGE' },
  categories: { permission: 'CATEGORY_MANAGE' },
  units: { permission: 'UNIT_MANAGE' },
  routing: { permission: 'ROUTING_MANAGE' },
  audit: { permission: 'AUDIT_VIEW' },
  retention: { permission: 'RETENTION_POLICY_MANAGE' },
  retentionExecutions: { permission: 'RETENTION_EXECUTE' },
} as const satisfies Record<string, PermissionCheck>;

export const ADMIN_DESTINATIONS = [
  ['/admin', ACCESS.dashboard],
  ['/admin/denuncias', ACCESS.reports],
  ['/admin/usuarios', ACCESS.users],
  ['/admin/equipes', ACCESS.teams],
  ['/admin/categorias', ACCESS.categories],
  ['/admin/unidades', ACCESS.units],
  ['/admin/routing-rules', ACCESS.routing],
  ['/admin/auditoria', ACCESS.audit],
  ['/admin/retencao/politicas', ACCESS.retention],
  ['/admin/retencao/execucoes', ACCESS.retentionExecutions],
] as const;

export function adminLandingPath(permissions: readonly string[]) {
  return ADMIN_DESTINATIONS.find(([, check]) => can(permissions, check))?.[0] ?? '/admin/perfil';
}
