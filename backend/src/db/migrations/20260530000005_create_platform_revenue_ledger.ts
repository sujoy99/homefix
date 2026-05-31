import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('platform_revenue_ledger', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('payment_id').notNullable().unique().references('id').inTable('payments').onDelete('RESTRICT');
    table.uuid('commission_rule_id').notNullable().references('id').inTable('commission_rules').onDelete('RESTRICT');

    // Platform fee in paisa for this payment
    table.integer('amount_paisa').notNullable();

    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE INDEX idx_revenue_ledger_created_at ON platform_revenue_ledger (created_at DESC)');
  await knex.raw('CREATE INDEX idx_revenue_ledger_commission_rule ON platform_revenue_ledger (commission_rule_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('platform_revenue_ledger');
}
