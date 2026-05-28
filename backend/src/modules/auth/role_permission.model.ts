import { Model } from 'objection';

export class RolePermissionModel extends Model {
  static tableName = 'role_permissions';

  id!: string;
  role_id!: string;
  permission_id!: string;
  created_at!: string;
  updated_at!: string;

  static relationMappings = {
    role: {
      relation: Model.BelongsToOneRelation,
      modelClass: require('./role.model').RoleModel,
      join: { from: 'role_permissions.role_id', to: 'roles.id' },
    },
    permission: {
      relation: Model.BelongsToOneRelation,
      modelClass: require('./permission.model').PermissionModel,
      join: { from: 'role_permissions.permission_id', to: 'permissions.id' },
    },
  };
}
