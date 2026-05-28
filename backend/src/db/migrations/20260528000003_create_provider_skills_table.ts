import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('provider_skills', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('provider_id').notNullable().references('id').inTable('provider_profiles').onDelete('CASCADE');
    table.uuid('category_id').notNullable().references('id').inTable('categories').onDelete('CASCADE');
    table.boolean('is_primary').notNullable().defaultTo(false);
    table.timestamps(true, true);
    table.unique(['provider_id', 'category_id']);
  });

  await knex.raw('CREATE INDEX idx_provider_skills_provider_id ON provider_skills (provider_id)');
  await knex.raw('CREATE INDEX idx_provider_skills_category_id ON provider_skills (category_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX IF EXISTS idx_provider_skills_provider_id');
  await knex.raw('DROP INDEX IF EXISTS idx_provider_skills_category_id');
  await knex.schema.dropTableIfExists('provider_skills');
}
