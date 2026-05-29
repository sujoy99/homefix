import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('users', 'nid_photo_back_url');
  if (!hasColumn) {
    await knex.schema.table('users', (table) => {
      table.string('nid_photo_back_url').nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('users', 'nid_photo_back_url');
  if (hasColumn) {
    await knex.schema.table('users', (table) => {
      table.dropColumn('nid_photo_back_url');
    });
  }
}
