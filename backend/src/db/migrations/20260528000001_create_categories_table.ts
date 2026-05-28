import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).notNullable();
    table.string('name_bn', 150).nullable();
    table.string('slug', 120).notNullable().unique();
    table.text('description').nullable();
    table.string('icon_url').nullable();
    table.boolean('requires_area').notNullable().defaultTo(false);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.integer('sort_order').notNullable().defaultTo(0);
    table.timestamps(true, true);
  });

  await knex.raw('CREATE INDEX idx_categories_is_active ON categories (is_active)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX IF EXISTS idx_categories_is_active');
  await knex.schema.dropTableIfExists('categories');
}
