import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('users', 'address');
  if (!hasColumn) {
    await knex.schema.table('users', (table) => {
      table.string('address', 500).nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('users', 'address');
  if (hasColumn) {
    await knex.schema.table('users', (table) => {
      table.dropColumn('address');
    });
  }
}
