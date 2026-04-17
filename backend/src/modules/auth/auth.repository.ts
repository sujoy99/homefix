import { randomUUID } from 'crypto';

import { transaction, PartialModelObject, Transaction } from 'objection';
import { User } from '@modules/users/user.model';
import { AuthAccount } from './auth.model';

import { User as U, CreateUserInput, UserResgistrationRequest} from '@modules/users/user.types';
import { users, UserStore } from '@modules/users/user.store';
import { CreateUserRepoResult } from './auth.types';

export class AuthRepository {
  /**
   * Find a user by email address
   *
   * Purpose:
   * - Used during authentication (login, registration)
   * - Ensures email uniqueness
   *
   * Behavior:
   * - Returns the user if email exists
   * - Returns null if no matching user is found
   *
   * Notes:
   * - Email comparison is case-insensitive at input validation level
   * - Repository layer is responsible for data lookup only
   */
  static async findByEmail(email: string): Promise<U | null> {
    for (const user of users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

   /**
   * Find a user by mobile
   * 
   * Behavior:
   * - Returns the user if mobile exists
   * - Returns null if no matching user is found
   */
  static async findById(authAccountId: string): Promise<AuthAccount | null> {
    const authAccount = await AuthAccount.query().findOne({ id: authAccountId });
    return authAccount ?? null;
  }

   /**
   * Find a user by mobile
   * 
   * Behavior:
   * - Returns the user if mobile exists
   * - Returns null if no matching user is found
   */
  static async findByMobile(mobile: string): Promise<User | null> {
    const user = await User.query().findOne({ mobile });
    return user ?? null;
  }


  static async handleFailedLogin(id: string) {
    return AuthAccount.query()
      .patch({
        failed_attempts: AuthAccount.knex().raw('failed_attempts + 1'),
        lock_until: AuthAccount.knex().raw(`
          CASE 
            WHEN failed_attempts + 1 >= 5 
            THEN NOW() + interval '15 minutes'
            ELSE lock_until
          END
        `),
      })
      .where('id', id);
  }

  static async updateFailedAttempts(
    id: string,
    failedAttempts: number,
    lockUntil?: Date | null
  ) {
    return AuthAccount.query()
      .patch({
        failed_attempts: failedAttempts,
        lock_until: lockUntil ?? null,
      })
      .where('id', id);
  }


  static async markLoginSuccess(id: string, trx?: Transaction) {
    return AuthAccount.query(trx)
      .patch({
        failed_attempts: 0,
        lock_until: null,
        last_login: AuthAccount.raw('NOW()'),
      })
      .where('id', id);
  }

  static async invalidateAllUserSessions(userId: string) {
    return AuthAccount.query()
      .patch({
        refresh_token_version: AuthAccount.raw('gen_random_uuid()'),
      })
      .where('user_id', userId);
  }

  /**
   * Create user
   * - Repository generates ID
   * - Returns full User entity
   */
  static async create(data: CreateUserInput): Promise<U> {
    const user: U = {
      id: randomUUID(),
      ...data,
      tokenVersion: 1
    };

    UserStore.save(user.id, user);
    return user;
  }

  static async createUser(data: UserResgistrationRequest): Promise<CreateUserRepoResult> {
    return transaction(User.knex(), async (trx) => {

      /**
       * 1. Prepare user insert object
       */
      const userData: PartialModelObject<User> = {
        full_name: data.full_name,
        mobile: data.mobile,
        nid: data.nid,
        role: data.role,
        status: data.status,

        email: data.email ?? null,
        photo_url: data.photo_url ?? null,
        nid_photo_url: data.nid_photo_url ?? null,

        /**
         * Keep raw separately to reduce TS complexity
         */
        area: trx.raw(
          `ST_SetSRID(ST_MakePoint(?, ?), 4326)`,
          [data.longitude, data.latitude]
        ) as any,
      };

      /**
       * 2. Insert user
       */
      const user = await User.query(trx).insert(userData).returning([
        'id',
        'short_code',
        'full_name',
        'mobile',
        'role',
        'status',
      ]);

      /**
       * 3. Prepare auth account
       */
      const authData: PartialModelObject<AuthAccount> = {
        user_id: user.id,
        auth_method: data.auth_method,
        password_hash: data.hashedPassword ?? null,
        refresh_token_version: trx.raw('gen_random_uuid()') as any,
      };

      /**
       * 4. Insert auth account
       */
      const authAccount = await AuthAccount.query(trx).insert(authData).returning([
        'id',
        'auth_method',
      ]);

      return {
        user,
        auth: authAccount,
      };
    });
  }
}
