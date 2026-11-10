import type { AdminUser } from '../types/auth';

export const ROLE_CODES = {
  ADMIN_MASTER: 'ADMIN_MASTER',
  ADMIN_TECHNICAL: 'ADMIN_TECHNICAL',
  TRIAGE: 'TRIAGE',
  INVESTIGATOR: 'INVESTIGATOR',
  MANAGER: 'MANAGER',
  AUDITOR: 'AUDITOR',
} as const;

function normalized(value: string) {
  return value.trim().toUpperCase();
}

export function hasRole(roles: string[] | undefined, code: string) {
  if (!roles?.length) return false;
  const accepted = new Set([normalized(code)]);
  return roles.some((role) => accepted.has(normalized(role)));
}

export function isAdminMaster(roles: string[] | undefined) {
  return hasRole(roles, ROLE_CODES.ADMIN_MASTER);
}

export function userUnitIds(user: AdminUser | null | undefined) {
  return new Set((user?.units ?? []).map((unit) => unit.id));
}

export function sharesUnit(unitIds: Set<string>, candidateUnitIds: string[]) {
  if (!unitIds.size) return false;
  return candidateUnitIds.some((id) => unitIds.has(id));
}

/**
 * Usado nas telas administrativas regionais. Um registro só é considerado
 * totalmente pertencente ao escopo quando possui ao menos uma unidade e
 * TODAS as unidades estão dentro do escopo do responsável autenticado.
 *
 * Isso evita expor um usuário/equipe compartilhado com outra região apenas
 * porque existe uma unidade em comum.
 */
export function isFullyWithinUnitScope(unitIds: Set<string>, candidateUnitIds: string[]) {
  if (!unitIds.size || !candidateUnitIds.length) return false;
  return candidateUnitIds.every((id) => unitIds.has(id));
}

export function scopedUnitOptions<T extends { id: string }>(
  items: T[],
  unitIds: Set<string>,
  master: boolean,
) {
  if (master) return items;
  if (!unitIds.size) return [];
  return items.filter((item) => unitIds.has(item.id));
}
