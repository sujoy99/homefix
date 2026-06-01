import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('reviews', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('job_id').notNullable().unique().references('id').inTable('jobs').onDelete('RESTRICT');
    table.uuid('resident_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.uuid('provider_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');

    table.smallint('rating').notNullable(); // 1–5
    table.text('comment').nullable();

    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE INDEX idx_reviews_provider_id ON reviews (provider_id)');
  await knex.raw('CREATE INDEX idx_reviews_resident_id ON reviews (resident_id)');

  await knex.schema.alterTable('users', (table) => {
    table.decimal('avg_rating', 4, 2).nullable().defaultTo(null);
    table.integer('review_count').notNullable().defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('avg_rating');
    table.dropColumn('review_count');
  });
  await knex.schema.dropTableIfExists('reviews');
}
