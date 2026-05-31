import { transaction, PartialModelObject, Transaction, UniqueViolationError } from 'objection';
import type { TransactionOrKnex } from 'objection';
import { User } from '@modules/users/user.model';
import { AuthAccount } from './auth.model';
import { UserResgistrationRequest } from '@modules/users/user.types';
import { CreateUserRepoResult } from './auth.types';
import { mapUniqueViolation } from '@errors/db-error-map';

export class AuthRepository {
  /**
   * Find a user by mobile
   */
  static async findByMobile(mobile: string): Promise<User | null> {
    const user = await User.query().findOne({ mobile });
    return user ?? null;
  }

  /**
   * Find auth account by ID
   */
  static async findById(authAccountId: string): Promise<AuthAccount | null> {
    const authAccount = await AuthAccount.query().findOne({ id: authAccountId });
    return authAccount ?? null;
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
   * Returns true if a token version is still valid for the given user.
   * Fails after logoutAll because all versions are rotated.
   */
  static async isTokenVersionValid(userId: string, tokenVersion: string): Promise<boolean> {
    const account = await AuthAccount.query()
      .where('user_id', userId)
      .where('refresh_token_version', tokenVersion)
      .first();
    return !!account;
  }

  /**
   * Core user + auth_account inserts — must run inside a caller-provided transaction.
   * Used by createUser (self-contained) and auth.service.ts register (joins the
   * outer transaction that also writes provider_profiles + provider_skills).
   */
  static async insertUserAndAuth(
    data: UserResgistrationRequest,
    trx: TransactionOrKnex
  ): Promise<CreateUserRepoResult> {
    const db = User.knex();

    // db.raw() for PostGIS and gen_random_uuid() are valid Knex expressions that
    // Objection passes straight to pg — the object is cast at the boundary.
    const userData = {
      full_name: data.full_name,
      mobile: data.mobile,
      nid: data.nid,
      role: data.role,
      status: data.status,
      email: data.email ?? null,
      photo_url: data.photo_url ?? null,
      nid_photo_url: data.nid_photo_url ?? null,
      nid_photo_back_url: data.nid_photo_back_url ?? null,
      area: db.raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)`, [data.longitude, data.latitude]),
    } as unknown as PartialModelObject<User>;

    const user = await User.query(trx).insert(userData).returning([
      'id', 'short_code', 'full_name', 'mobile', 'role', 'status',
    ]);

    const authData = {
      user_id: user.id,
      auth_method: data.auth_method,
      password_hash: data.hashedPassword ?? null,
      refresh_token_version: db.raw('gen_random_uuid()'),
    } as unknown as PartialModelObject<AuthAccount>;

    const authAccount = await AuthAccount.query(trx).insert(authData).returning([
      'id', 'auth_method',
    ]);

    return { user, auth: authAccount };
  }

  /**
   * Create user and auth account (V2) — self-contained transaction.
   * Use insertUserAndAuth when you need to join an outer transaction.
   */
  static async createUser(data: UserResgistrationRequest): Promise<CreateUserRepoResult> {
    try {
      return await transaction(User.knex(), async (trx) =>
        AuthRepository.insertUserAndAuth(data, trx)
      );
    } catch (err) {
      if (err instanceof UniqueViolationError) throw mapUniqueViolation(err.constraint);
      throw err;
    }
  }
}
