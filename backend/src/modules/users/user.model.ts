import { Model } from 'objection';
import { UserRole, UserStatus } from './user.types';
import { AuthAccount } from '@modules/auth/auth.model';

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

  authAccounts?: AuthAccount[];

  /**
   * ============================
   * Relations
   * ============================
   */
  static relationMappings = {
    authAccounts: {
      relation: Model.HasManyRelation,
      modelClass: require('../auth/auth.model').AuthAccount,
      join: {
        from: 'users.id',
        to: 'auth_accounts.user_id',
      },
    },
  };
}
