import { Model } from 'objection';

/**
 * ============================
 * AuthAccount Model
 * ============================
 * Represents authentication-related data
 * Separate from user identity
 */
export class AuthAccount extends Model {
  static tableName = 'auth_accounts';

  id!: string;

  /**
   * Foreign key → users.id
   */
  user_id!: string;

  /**
   * Credentials (supports password/otp/auth2)
   */
  auth_method!: string;
  password_hash?: string | null;
  salt?: string;

  /**
   * Security / tracking
   */
  last_login?: string;
  failed_attempts?: number;
  lock_until?: string;

  /**
   * Refresh token version (JWT invalidation)
   */
  refresh_token_version?: string;

  created_at!: string;
  updated_at!: string;

  /**
   * ============================
   * Relations
   * ============================
   */
  static relationMappings = {
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: require('../users/user.model').User,
      join: {
        from: 'auth_accounts.user_id',
        to: 'users.id',
      },
    },
  };
}