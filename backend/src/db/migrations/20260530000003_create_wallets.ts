import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('wallets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // One wallet per provider
    table.uuid('user_id').notNullable().unique().references('id').inTable('users').onDelete('RESTRICT');

    // All balances in paisa
    table.integer('balance_paisa').notNullable().defaultTo(0);
    table.integer('total_earned_paisa').notNullable().defaultTo(0);
    table.integer('total_withdrawn_paisa').notNullable().defaultTo(0);

    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('wallets');
}
