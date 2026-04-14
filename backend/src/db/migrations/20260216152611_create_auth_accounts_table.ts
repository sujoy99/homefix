import { AuthMethod } from "@modules/auth/auth.types";
import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('auth_accounts', (table) => {
    /**
     * Primary Key
     */
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // FK to user profile
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

     /**
     *  Authentication Provider
     * - Defines how user logs in
     */
    table
      .enum('auth_method', [AuthMethod.PASSWORD, AuthMethod.OTP, AuthMethod.GOOGLE, AuthMethod.FACEBOOK])
      .notNullable();  

    // Credentials
    /**
     * Password-based auth (optional)
     */
    table.string('password_hash', 255).nullable();
    table.string('salt', 255).nullable(); // optional, if using manual salt

    /**
     * OAuth / External provider ID
     * - e.g. Google user ID
     */
    table.string('provider_id', 255).nullable();

    // Login / security info
    table.timestamp('last_login').nullable();
    table.integer('failed_attempts').defaultTo(0);
    table.timestamp('lock_until').nullable(); // lock account temporarily

    // JWT / refresh token versioning
    table.string('refresh_token_version', 36)
     .notNullable()
     .defaultTo(knex.raw('gen_random_uuid()'));

    table.timestamps(true, true);

    /**
     * Prevent duplicate auth type per user
     */
    table.unique(['user_id', 'auth_method']);
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('auth_accounts');
}

