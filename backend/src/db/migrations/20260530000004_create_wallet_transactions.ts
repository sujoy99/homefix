import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('wallet_transactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('wallet_id').notNullable().references('id').inTable('wallets').onDelete('RESTRICT');

    table.enum('type', ['credit', 'withdrawal']).notNullable();

    // Paisa — always positive; direction inferred from type
    table.integer('amount_paisa').notNullable();

    // job_id for credit, withdrawal_request_id for withdrawal
    table.uuid('reference_id').notNullable();

    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE INDEX idx_wallet_transactions_wallet_id ON wallet_transactions (wallet_id)');
  await knex.raw('CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions (created_at DESC)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('wallet_transactions');
}
