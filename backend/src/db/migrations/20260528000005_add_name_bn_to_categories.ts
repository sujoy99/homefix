import type { Knex } from 'knex';

/**
 * Adds name_bn column to existing installations.
 * Fresh installs already have it via 20260528000001 — this migration is a no-op for them.
 */
export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('categories', 'name_bn');
  if (!hasColumn) {
    await knex.schema.alterTable('categories', (table) => {
      table.string('name_bn', 150).nullable().after('name');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('categories', 'name_bn');
  if (hasColumn) {
    await knex.schema.alterTable('categories', (table) => {
      table.dropColumn('name_bn');
    });
  }
}
