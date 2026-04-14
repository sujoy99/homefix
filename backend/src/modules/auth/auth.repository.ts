import { randomUUID } from 'crypto';

import { transaction, PartialModelObject } from 'objection';
import { User } from '@modules/users/user.model';
import { AuthAccount } from './auth.model';
import knex from '@config/db'; // your knex instance

import { User as U, CreateUserInput, UserRole, UserStatus, UserResgistrationRequest, UserRegistrationResponse } from '@modules/users/user.types';
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
  static async findByMobile(mobile: string): Promise<User | null> {
    const user = await User.query().findOne({ mobile });
    return user ?? null;
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
