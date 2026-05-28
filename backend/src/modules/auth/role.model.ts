import { Model } from 'objection';

export class RoleModel extends Model {
  static tableName = 'roles';

  id!: string;
  name!: string;
  description!: string | null;
  created_at!: string;
  updated_at!: string;

  static relationMappings = {
    rolePermissions: {
      relation: Model.HasManyRelation,
      modelClass: require('./role_permission.model').RolePermissionModel,
      join: { from: 'roles.id', to: 'role_permissions.role_id' },
    },
  };
}
