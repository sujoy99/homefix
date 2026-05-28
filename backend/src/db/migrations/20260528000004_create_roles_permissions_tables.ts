import type { Knex } from 'knex';

/**
 * Creates 3 tables for DB-driven RBAC (schema only).
 * Default seed data lives in src/db/seeds/01_roles_permissions.ts
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('roles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 20).notNullable().unique();
    table.text('description').nullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('permissions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('code', 80).notNullable().unique();
    table.text('description').nullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('role_permissions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('role_id').notNullable().references('id').inTable('roles').onDelete('CASCADE');
    table.uuid('permission_id').notNullable().references('id').inTable('permissions').onDelete('CASCADE');
    table.timestamps(true, true);
    table.unique(['role_id', 'permission_id']);
  });

  await knex.raw('CREATE INDEX idx_role_permissions_role_id ON role_permissions (role_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX IF EXISTS idx_role_permissions_role_id');
  await knex.schema.dropTableIfExists('role_permissions');
  await knex.schema.dropTableIfExists('permissions');
  await knex.schema.dropTableIfExists('roles');
}
