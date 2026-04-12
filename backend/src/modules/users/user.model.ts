import { Model } from 'objection';

/**
 * User Model mapped to users table
 */
export class User extends Model {
  static tableName = 'users';

  id!: string;
  full_name!: string;
  mobile!: string;
  nid!: string;
  role!: 'resident' | 'provider' | 'admin';
  status!: 'pending_verification' | 'active' | 'inactive';
  area?: object;
  photo_url?: string;
  nid_photo_url?: string;
  created_at?: string;
  updated_at?: string;
}
