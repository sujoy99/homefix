import { RoleModel } from './role.model';
import { PermissionModel } from './permission.model';
import { RolePermissionModel } from './role_permission.model';
import { UserRole } from '@modules/users/user.types';
import { Permission } from './permissions';

export type RolePermissionRow = { role: string; permission_code: string };

export class RolePermissionRepository {
  /** Load all role→permission mappings via join (used by PermissionCache at startup). */
  static async findAll(): Promise<RolePermissionRow[]> {
    const rows = await RolePermissionModel.query()
      .withGraphFetched('[role, permission]')
      .modifyGraph('role', (b) => b.select('name'))
      .modifyGraph('permission', (b) => b.select('code'));

    return rows.map((rp) => ({
      role: (rp as unknown as { role: { name: string } }).role.name,
      permission_code: (rp as unknown as { permission: { code: string } }).permission.code,
    }));
  }

  /** All permissions for a given role. */
  static async findByRole(role: UserRole): Promise<Permission[]> {
    const roleRow = await RoleModel.query().findOne({ name: role });
    if (!roleRow) return [];

    const rows = await RolePermissionModel.query()
      .where('role_id', roleRow.id)
      .withGraphFetched('permission')
      .modifyGraph('permission', (b) => b.select('code'));

    return rows.map((rp) => (rp as unknown as { permission: { code: string } }).permission.code as Permission);
  }

  /** All roles with their permissions. */
  static async findAllRolesWithPermissions(): Promise<Array<{ id: string; name: string; permissions: string[] }>> {
    const roles = await RoleModel.query()
      .withGraphFetched('rolePermissions.permission')
      .modifyGraph('rolePermissions.permission', (b) => b.select('code'));

    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      permissions: ((r as unknown as { rolePermissions: Array<{ permission: { code: string } }> })
        .rolePermissions ?? []).map((rp) => rp.permission.code),
    }));
  }

  /** All available permissions. */
  static async findAllPermissions(): Promise<PermissionModel[]> {
    return PermissionModel.query().orderBy('code');
  }

  /** Assign a permission to a role (idempotent). */
  static async assign(role: UserRole, permissionCode: Permission): Promise<void> {
    const [roleRow, permRow] = await Promise.all([
      RoleModel.query().findOne({ name: role }),
      PermissionModel.query().findOne({ code: permissionCode }),
    ]);

    if (!roleRow || !permRow) return;

    await RolePermissionModel.query()
      .insert({ role_id: roleRow.id, permission_id: permRow.id })
      .onConflict(['role_id', 'permission_id'])
      .ignore();
  }

  /** Revoke a permission from a role. */
  static async revoke(role: UserRole, permissionCode: Permission): Promise<number> {
    const [roleRow, permRow] = await Promise.all([
      RoleModel.query().findOne({ name: role }),
      PermissionModel.query().findOne({ code: permissionCode }),
    ]);

    if (!roleRow || !permRow) return 0;

    return RolePermissionModel.query()
      .delete()
      .where({ role_id: roleRow.id, permission_id: permRow.id });
  }
}
