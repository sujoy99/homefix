import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('payments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('job_id').notNullable().unique().references('id').inTable('jobs').onDelete('RESTRICT');
    table.uuid('resident_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.uuid('provider_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');

    // All monetary values stored as integer paisa (1 taka = 100 paisa) — no floats
    table.integer('amount_paisa').notNullable();

    // Locked at time of Admin verify — commission_rules may change later
    table.decimal('commission_rate', 5, 4).nullable();
    table.uuid('commission_rule_id').nullable().references('id').inTable('commission_rules').onDelete('RESTRICT');
    table.integer('platform_fee_paisa').nullable();
    table.integer('provider_net_paisa').nullable();

    table.enum('method', ['bkash', 'nagad', 'bank_transfer', 'cash', 'card']).notNullable();

    // Resident's TxID — required for bkash/nagad/bank_transfer, null for cash/card
    table.string('transaction_id').nullable();

    table
      .enum('status', ['pending', 'submitted', 'verified', 'completed', 'failed', 'refunded'])
      .notNullable()
      .defaultTo('submitted');

    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('verified_at', { useTz: true }).nullable();
    table.uuid('verified_by_admin_id').nullable().references('id').inTable('users').onDelete('RESTRICT');
  });

  await knex.raw('CREATE INDEX idx_payments_job_id ON payments (job_id)');
  await knex.raw('CREATE INDEX idx_payments_resident_id ON payments (resident_id)');
  await knex.raw('CREATE INDEX idx_payments_provider_id ON payments (provider_id)');
  await knex.raw('CREATE INDEX idx_payments_status ON payments (status)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('payments');
}
