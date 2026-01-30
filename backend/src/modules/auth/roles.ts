import { UserRole } from '@modules/users/user.types';
import { Permission } from './permissions';

/**
 * ============================
 * Role → Permission Mapping
 * ============================
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.ADMIN_DASHBOARD_VIEW,
    Permission.SETTINGS_MANAGE,
    Permission.JOB_READ,
    Permission.JOB_WRITE,
  ],

  [UserRole.PROVIDER]: [Permission.JOB_READ, Permission.JOB_WRITE],

  [UserRole.RESIDENT]: [Permission.JOB_READ],
};
