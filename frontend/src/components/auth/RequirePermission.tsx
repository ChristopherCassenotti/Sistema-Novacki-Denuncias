import { Navigate, Outlet } from 'react-router';
import { useCan } from '../../hooks/useCan';

import type { PermissionCheck } from '../../utils/authorization';
type RequirePermissionProps = PermissionCheck;

export function RequirePermission({ permission, anyOf, allOf }: RequirePermissionProps) {
  const allowed = useCan({ permission, anyOf, allOf });
  return allowed ? <Outlet /> : <Navigate to="/403" replace />;
}
