import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('auth_accounts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // FK to user profile
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    // Credentials
    table.string('password_hash', 255).notNullable();
    table.string('salt', 255).nullable(); // optional, if using manual salt

    // Login / security info
    table.timestamp('last_login').nullable();
    table.integer('failed_attempts').defaultTo(0);
    table.timestamp('lock_until').nullable(); // lock account temporarily

    // JWT / refresh token versioning
    table.string('refresh_token_version', 36).nullable();

    table.timestamps(true, true);
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('auth_accounts');
}

