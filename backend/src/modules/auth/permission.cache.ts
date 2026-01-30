import { UserRole } from '@modules/users/user.types';
import { Permission } from './permissions';
import { ROLE_PERMISSIONS } from './roles';

/**
 * ============================
 * Permission Cache
 * ============================
 * - In-memory for now
 * - Redis later (same interface)
 */
class PermissionCache {
  private cache = new Map<UserRole, Permission[]>();

  get(role: UserRole): Permission[] {
    if (!this.cache.has(role)) {
      this.cache.set(role, ROLE_PERMISSIONS[role] ?? []);
    }
    return this.cache.get(role)!;
  }

  clear(role?: UserRole) {
    if (role) {
      this.cache.delete(role);
    } else {
      this.cache.clear();
    }
  }
}

export const permissionCache = new PermissionCache();
