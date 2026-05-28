import { RolePermissionRepository } from './role_permission.repository';
import { permissionCache } from './permission.cache';
import { UserRole } from '@modules/users/user.types';
import { Permission } from './permissions';
import { NotFoundError, BadRequestError } from '@errors/http-errors';
import { ErrorCode } from '@errors/error-code';

export class RbacService {
  static async listRolesWithPermissions() {
    return RolePermissionRepository.findAllRolesWithPermissions();
  }

  static async listPermissions() {
    return RolePermissionRepository.findAllPermissions();
  }

  static async assignPermission(roleName: string, permissionCode: string): Promise<void> {
    const role = roleName as UserRole;
    if (!Object.values(UserRole).includes(role)) {
      throw new BadRequestError(ErrorCode.BAD_REQUEST, `Invalid role: ${roleName}`);
    }

    const permission = permissionCode as Permission;
    if (!Object.values(Permission).includes(permission)) {
      throw new BadRequestError(ErrorCode.BAD_REQUEST, `Invalid permission code: ${permissionCode}`);
    }

    await RolePermissionRepository.assign(role, permission);
    await permissionCache.refresh();
  }

  static async revokePermission(roleName: string, permissionCode: string): Promise<void> {
    const role = roleName as UserRole;
    if (!Object.values(UserRole).includes(role)) {
      throw new BadRequestError(ErrorCode.BAD_REQUEST, `Invalid role: ${roleName}`);
    }

    const permission = permissionCode as Permission;
    if (!Object.values(Permission).includes(permission)) {
      throw new BadRequestError(ErrorCode.BAD_REQUEST, `Invalid permission code: ${permissionCode}`);
    }

    const deleted = await RolePermissionRepository.revoke(role, permission);
    if (deleted === 0) {
      throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Role-permission mapping not found');
    }
    await permissionCache.refresh();
  }

  static async refreshCache(): Promise<void> {
    await permissionCache.refresh();
  }
}
