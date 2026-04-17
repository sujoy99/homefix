import { User } from '@modules/users/user.model';
import { Model } from 'objection';
import { AuthAccount } from './auth.model';

/**
 * ============================
 * RefreshToken Model
 * ============================
 * Represents authentication-related data
 * Separate from user identity
 */
export class RefreshToken extends Model {
  static tableName = 'auth_refresh_tokens';

  id!: string;

  /**
   * Foreign key → users.id
   */
  user_id!: string;
  auth_account_id!: string;
 
  device_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  
  refresh_token_version!: string;

  is_revoked!: boolean;

  expires_at!: Date;
  created_at!: Date;

  user?: User;
  authAccount?: AuthAccount;

  /**
   * ============================
   * Relations
   * ============================
   */
  static relationMappings = {
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'auth_refresh_tokens.user_id',
        to: 'users.id',
      },
    },

    authAccount: {
      relation: Model.BelongsToOneRelation,
      modelClass: AuthAccount,
      join: {
        from: 'auth_refresh_tokens.auth_account_id',
        to: 'auth_accounts.id',
      },
    },
  };
}