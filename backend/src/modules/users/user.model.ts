import { Model } from 'objection';
import { UserRole, UserStatus } from './user.types';

/**
 * User Model mapped to users table
 */
export class User extends Model {
  static tableName = 'users';

  id!: string;
  short_code!: string;

  full_name!: string;
  mobile!: string;
  nid!: string;
  email?: string | null;

  role!: UserRole;
  status!: UserStatus;

  // area?: object;
  area?: {
    latitude: number;
    longitude: number;
  };

  photo_url?: string | null;
  nid_photo_url?: string | null;
  
  created_at!: string;
  updated_at!: string;

  /**
   * ============================
   * Relations
   * ============================
   */
  static relationMappings = {
    authAccount: {
      relation: Model.HasOneRelation,
      modelClass: require('../auth/auth.model').AuthAccount,
      join: {
        from: 'users.id',
        to: 'auth_accounts.user_id',
      },
    },
  };
}
