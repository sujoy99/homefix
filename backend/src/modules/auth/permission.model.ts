import { Model } from 'objection';

export class PermissionModel extends Model {
  static tableName = 'permissions';

  id!: string;
  code!: string;
  description!: string | null;
  created_at!: string;
  updated_at!: string;
}
