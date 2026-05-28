import { UserRole } from '@modules/users/user.types';
import { Permission } from './permissions';
import { RolePermissionRepository } from './role_permission.repository';
import { logger } from '@logger/logger';

/**
 * ============================
 * Permission Cache
 * ============================
 * Fully DB-driven. Loaded from role_permissions table at server startup
 * (and in tests via tests/setup.ts beforeAll hook).
 * Served synchronously on every request — zero DB hits at request time.
 *
 * To add or change permissions: update the role_permissions table,
 * then call permissionCache.refresh() or restart the server.
 */
class PermissionCache {
  private cache = new Map<UserRole, Set<Permission>>();
  private loaded = false;

  async loadFromDb(): Promise<void> {
    const rows = await RolePermissionRepository.findAll();

    this.cache.clear();
    for (const row of rows) {
      const role = row.role as UserRole;
      if (!this.cache.has(role)) {
        this.cache.set(role, new Set());
      }
      this.cache.get(role)!.add(row.permission_code as Permission);
    }
    this.loaded = true;
    logger.info(`[PermissionCache] Loaded ${rows.length} role-permission mappings from DB`);
  }

  get(role: UserRole): Permission[] {
    return Array.from(this.cache.get(role) ?? []);
  }

  has(role: UserRole, permission: Permission): boolean {
    return this.cache.get(role)?.has(permission) ?? false;
  }

  async refresh(): Promise<void> {
    await this.loadFromDb();
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  clear(role?: UserRole): void {
    if (role) {
      this.cache.delete(role);
    } else {
      this.cache.clear();
      this.loaded = false;
    }
  }
}

export const permissionCache = new PermissionCache();
