import type { ReactNode } from 'react';
import { useCan } from '../../hooks/useCan';

import type { PermissionCheck } from '../../utils/authorization';

type PermissionGuardProps = PermissionCheck & {
  fallback?: ReactNode;
  children: ReactNode;
};

export function PermissionGuard({
  permission,
  anyOf,
  allOf,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const allowed = useCan({ permission, anyOf, allOf });
  return allowed ? <>{children}</> : <>{fallback}</>;
}
