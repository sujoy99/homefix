import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('provider_profiles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().unique().references('id').inTable('users').onDelete('CASCADE');
    table.text('bio').nullable();
    table.integer('experience_years').notNullable().defaultTo(0);
    table.decimal('hourly_rate', 10, 2).nullable();
    table.boolean('is_available').notNullable().defaultTo(true);
    table.decimal('rating_avg', 3, 2).notNullable().defaultTo(0);
    table.integer('total_reviews').notNullable().defaultTo(0);
    table.timestamps(true, true);
  });

  await knex.raw('CREATE INDEX idx_provider_profiles_user_id ON provider_profiles (user_id)');
  await knex.raw('CREATE INDEX idx_provider_profiles_is_available ON provider_profiles (is_available)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX IF EXISTS idx_provider_profiles_user_id');
  await knex.raw('DROP INDEX IF EXISTS idx_provider_profiles_is_available');
  await knex.schema.dropTableIfExists('provider_profiles');
}
