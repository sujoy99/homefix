/**
 * ============================
 * Default Role → Permission Mapping
 * ============================
 * DOCUMENTATION + SEED REFERENCE ONLY.
 * This object is NOT used at runtime — permissions are loaded from
 * the role_permissions table at server startup via PermissionCache.
 *
 * To change a role's permissions: update the role_permissions table
 * (or add a new migration), then restart the server.
 */
import { UserRole } from '@modules/users/user.types';
import { Permission } from './permissions';

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.ADMIN_DASHBOARD_VIEW,
    Permission.SETTINGS_MANAGE,
    Permission.JOB_READ,
    Permission.JOB_WRITE,
    Permission.CATEGORY_READ,
    Permission.CATEGORY_WRITE,
    Permission.PROVIDER_MANAGE,
    Permission.FILE_UPLOAD,
  ],

  [UserRole.PROVIDER]: [Permission.JOB_READ, Permission.JOB_WRITE, Permission.FILE_UPLOAD],

  [UserRole.RESIDENT]: [Permission.JOB_READ, Permission.FILE_UPLOAD],
};
