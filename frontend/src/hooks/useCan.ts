import { useAuth } from '../context/AuthContext';
import { can, type PermissionCheck } from '../utils/authorization';

export function useCan(check: PermissionCheck) {
  const { permissions } = useAuth();
  return can(permissions, check);
}
